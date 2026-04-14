"""Deployment service for composed dashboards.

Builds a single combined Redash dashboard in a target organization by stacking
the widgets of every sub-dashboard (that the org is assigned to) in the order
defined by the ComposedDashboard entries.

Data-source mapping strategy: match by name.  If a data source with the same
name exists in the target org it is used; otherwise the data source is copied
into the target org (linked to its existing default group – no new users or
user groups are ever created). The query is created with no data source only
if the template data source row itself is missing.

Idempotency:
  - First call  → creates a new dashboard in the target org.
  - Subsequent calls → deletes all widgets from the existing dashboard and
    recreates them from scratch so the result is always a clean snapshot.
"""

import json
import logging
from datetime import datetime, timezone

from redash.models import Dashboard, DataSource, Query, Visualization, Widget
from redash.models.base import db
from redash.models.users import User

logger = logging.getLogger(__name__)


def _sse(step, status, detail=""):
    """Format a single server-sent event carrying a step progress payload."""
    return f"data: {json.dumps({'step': step, 'status': status, 'detail': detail})}\n\n"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def deploy(composed_dashboard, target_org, existing_dashboard=None):
    """Deploy *composed_dashboard* into *target_org*.

    Returns the Redash Dashboard object that was created or updated.

    Args:
        composed_dashboard: ComposedDashboard model instance.
        target_org:         Redash Organization model instance for the client.
        existing_dashboard: Previously deployed Dashboard (or None for first run).
    """
    admin_user = _get_admin_user(target_org)
    sub_dashboards = _get_assigned_sub_dashboards(composed_dashboard, target_org)

    if not sub_dashboards:
        raise DeploymentError(
            f"No sub-dashboards assigned to org '{target_org.slug}' "
            f"for composed dashboard '{composed_dashboard.name}'"
        )

    deployed = _get_or_create_dashboard(composed_dashboard, target_org, admin_user, existing_dashboard)

    _clear_widgets(deployed)

    data_source_map = _build_data_source_map(sub_dashboards, target_org)
    query_cache = {}  # template query_id → new Query in target org

    row_offset = 0
    for sub_dashboard in sub_dashboards:
        row_offset = _copy_widgets(
            sub_dashboard=sub_dashboard,
            target_dashboard=deployed,
            target_org=target_org,
            admin_user=admin_user,
            data_source_map=data_source_map,
            query_cache=query_cache,
            row_offset=row_offset,
        )

    db.session.commit()
    logger.info(
        "Deployed composed dashboard %d (%s) to org %s – dashboard id %d, %d sub-dashboards",
        composed_dashboard.id,
        composed_dashboard.name,
        target_org.slug,
        deployed.id,
        len(sub_dashboards),
    )
    return deployed


def deploy_streaming(composed_dashboard, target_org, deployment_record, existing_dashboard=None):
    """Generator that runs the full deployment and yields SSE-formatted progress events.

    Each yielded string is a ready-to-send ``data: {...}\\n\\n`` SSE line.
    The final event is ``{"done": true, "deployment_id": ..., "deployed_dashboard_id": ...}``.

    *deployment_record* must already have been flushed (so it has an ``id``)
    but not yet committed – this generator updates its fields and commits
    everything in a single transaction at the very end.
    """
    # ── Step 1: admin user ────────────────────────────────────────────────
    yield _sse("Connecting to organization", "running")
    try:
        admin_user = _get_admin_user(target_org)
    except DeploymentError as exc:
        db.session.rollback()
        yield _sse("Connecting to organization", "error", str(exc))
        return
    yield _sse("Connecting to organization", "ok", admin_user.email)

    # ── Step 2: sub-dashboards ────────────────────────────────────────────
    yield _sse("Resolving sub-dashboards", "running")
    sub_dashboards = _get_assigned_sub_dashboards(composed_dashboard, target_org)
    if not sub_dashboards:
        db.session.rollback()
        yield _sse("Resolving sub-dashboards", "error", "No sub-dashboards are assigned to this organization")
        return
    yield _sse("Resolving sub-dashboards", "ok", f"{len(sub_dashboards)} found")

    # ── Step 3: data source map ───────────────────────────────────────────
    yield _sse("Mapping data sources", "running")
    try:
        data_source_map = _build_data_source_map(sub_dashboards, target_org)
    except Exception as exc:
        db.session.rollback()
        yield _sse("Mapping data sources", "error", str(exc))
        return
    yield _sse("Mapping data sources", "ok", f"{len(data_source_map)} source(s)")

    # ── Step 4: create or fetch the target dashboard ──────────────────────
    step_label = "Updating dashboard" if existing_dashboard else "Creating dashboard"
    yield _sse(step_label, "running")
    try:
        deployed = _get_or_create_dashboard(composed_dashboard, target_org, admin_user, existing_dashboard)
    except Exception as exc:
        db.session.rollback()
        yield _sse(step_label, "error", str(exc))
        return
    yield _sse(step_label, "ok", f"ID {deployed.id}")

    # ── Step 4b: clear existing widgets on redeploy ───────────────────────
    if existing_dashboard is not None:
        yield _sse("Clearing existing widgets", "running")
        _clear_widgets(deployed)
        yield _sse("Clearing existing widgets", "ok")

    # ── Steps 5…N: copy each sub-dashboard ───────────────────────────────
    query_cache = {}
    row_offset = 0
    for sub in sub_dashboards:
        label = f'Copying "{sub.name}"'
        yield _sse(label, "running")
        try:
            widget_count = sub.widgets.count()
            row_offset = _copy_widgets(
                sub_dashboard=sub,
                target_dashboard=deployed,
                target_org=target_org,
                admin_user=admin_user,
                data_source_map=data_source_map,
                query_cache=query_cache,
                row_offset=row_offset,
            )
        except Exception as exc:
            db.session.rollback()
            yield _sse(label, "error", str(exc))
            return
        yield _sse(label, "ok", f"{widget_count} widget(s)")

    # ── Final step: commit ────────────────────────────────────────────────
    yield _sse("Saving", "running")
    try:
        deployment_record.deployed_dashboard_id = deployed.id
        deployment_record.last_deployed_at = datetime.now(timezone.utc)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        yield _sse("Saving", "error", str(exc))
        return
    yield _sse("Saving", "ok")

    yield f"data: {json.dumps({'done': True, 'deployment_id': deployment_record.id, 'deployed_dashboard_id': deployed.id})}\n\n"


# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------


class DeploymentError(Exception):
    pass


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_admin_user(org):
    """Return an active user for the org to use as the owner of created objects.

    Prefers a member of the admin group; falls back to any non-disabled user in
    the org if no admin-group member can be found (e.g. when group IDs are
    mismatched in a dev setup).
    """
    admin_group = org.admin_group
    user = None

    if admin_group is not None:
        user = User.query.filter(
            User.org_id == org.id,
            User.group_ids.any(admin_group.id),
            User.disabled_at.is_(None),
        ).first()

    if user is None:
        # Fall back to any active user in the org.
        user = User.query.filter(
            User.org_id == org.id,
            User.disabled_at.is_(None),
        ).first()

    if user is None:
        raise DeploymentError(f"Org '{org.slug}' has no active users")
    return user


def _get_assigned_sub_dashboards(composed_dashboard, target_org):
    """Return template Dashboard objects in the composed dashboard, in entry order."""
    result = []
    for entry in composed_dashboard.entries:  # already ordered by order_index
        sub = Dashboard.query.get(entry.dashboard_id)
        if sub is not None:
            result.append(sub)
    return result


def _get_or_create_dashboard(composed_dashboard, target_org, admin_user, existing_dashboard):
    """Return the existing deployed dashboard if present, otherwise create a new one."""
    if existing_dashboard is not None:
        return existing_dashboard

    dashboard = Dashboard(
        name=composed_dashboard.name,
        org=target_org,
        user=admin_user,
        is_draft=False,
    )
    db.session.add(dashboard)
    db.session.flush()  # get the id before we add widgets
    return dashboard


def _clear_widgets(dashboard):
    """Delete all existing widgets from a dashboard so we can recreate them cleanly."""
    for widget in list(dashboard.widgets):
        db.session.delete(widget)
    db.session.flush()


def _create_data_source(template_source, target_org):
    """Copy *template_source* into *target_org*.

    Uses DataSource.create_with_group which creates the DataSource row and a
    DataSourceGroup row linking it to the org's existing default_group.
    No new users or user groups are created.
    Returns the newly created DataSource after flushing it to get an id.
    """
    new_ds = DataSource.create_with_group(
        name=template_source.name,
        type=template_source.type,
        options=template_source.options,
        org=target_org,
    )
    db.session.flush()
    logger.info(
        "Copied data source '%s' (type=%s) into org '%s' as id=%d",
        new_ds.name,
        new_ds.type,
        target_org.slug,
        new_ds.id,
    )
    return new_ds


def _build_data_source_map(sub_dashboards, target_org):
    """Build a {template_data_source_id: target_data_source_id} map.

    Matches by name against the target org's existing data sources.
    If no match is found, calls _create_data_source to copy it into the target
    org (linked to the org's existing default_group – no new users or groups
    are created). Maps to None only when the template source row is missing.
    """
    target_sources_by_name = {ds.name: ds for ds in DataSource.all(target_org)}

    template_source_ids = set()
    for sub in sub_dashboards:
        for widget in sub.widgets:
            if widget.visualization_id is not None:
                query = widget.visualization.query_rel
                if query and query.data_source_id is not None:
                    template_source_ids.add(query.data_source_id)

    mapping = {}
    for src_id in template_source_ids:
        source = DataSource.query.get(src_id)
        if source is None:
            mapping[src_id] = None
            continue

        existing = target_sources_by_name.get(source.name)
        if existing is not None:
            mapping[src_id] = existing.id
        else:
            new_ds = _create_data_source(source, target_org)
            target_sources_by_name[new_ds.name] = new_ds
            mapping[src_id] = new_ds.id

    return mapping


def _get_or_copy_query(template_query, target_org, admin_user, data_source_map, query_cache):
    """Return (or update) the equivalent of *template_query* in *target_org*.

    Lookup order:
    1. query_cache – avoids duplicate work when multiple widgets share the same
       template query within a single deployment call.
    2. Existing query in target_org with the same name – reuses it on redeploy
       rather than creating a new copy every time.
    3. Create – only when no match exists yet.
    """
    if template_query.id in query_cache:
        return query_cache[template_query.id]

    target_ds_id = data_source_map.get(template_query.data_source_id)

    existing = Query.query.filter_by(org_id=target_org.id, name=template_query.name, is_archived=False).first()
    if existing is not None:
        existing.query_text = template_query.query_text
        existing.description = template_query.description or ""
        existing.data_source_id = target_ds_id
        existing.schedule = template_query.schedule
        existing.options = template_query.options or {}
        existing.tags = list(template_query.tags or [])
        db.session.flush()
        query_cache[template_query.id] = existing
        return existing

    new_query = Query.create(
        name=template_query.name,
        query_text=template_query.query_text,
        description=template_query.description or "",
        org=target_org,
        user=admin_user,
        data_source_id=target_ds_id,
        schedule=template_query.schedule,
        options=template_query.options or {},
        tags=list(template_query.tags or []),
        is_draft=False,
    )
    db.session.flush()
    query_cache[template_query.id] = new_query
    return new_query


def _copy_visualization(template_viz, target_query):
    """Create a copy of *template_viz* attached to *target_query*.

    The TABLE visualization is created automatically by Query.create(), so we skip
    it to avoid duplicates; all other types are copied explicitly.
    """
    if template_viz.type == "TABLE" and template_viz.name == "Table":
        # Query.create() already added a default TABLE visualization – reuse it.
        default_viz = next(
            (v for v in target_query.visualizations if v.type == "TABLE"),
            None,
        )
        if default_viz is not None:
            return default_viz

    new_viz = Visualization(
        query_rel=target_query,
        type=template_viz.type,
        name=template_viz.name,
        description=template_viz.description or "",
        options=dict(template_viz.options or {}),
    )
    db.session.add(new_viz)
    db.session.flush()
    return new_viz


def _copy_widgets(sub_dashboard, target_dashboard, target_org, admin_user, data_source_map, query_cache, row_offset):
    """Copy all widgets from *sub_dashboard* into *target_dashboard*, shifted by *row_offset*.

    Returns the new row_offset (= old offset + height of this sub-dashboard).
    """
    max_bottom = 0

    for widget in sub_dashboard.widgets:
        position = (widget.options or {}).get("position", {})
        row = position.get("row", 0) + row_offset
        new_position = {**position, "row": row}
        new_options = {**widget.options, "position": new_position}

        if widget.visualization_id is not None:
            template_viz = widget.visualization
            template_query = template_viz.query_rel

            target_query = _get_or_copy_query(template_query, target_org, admin_user, data_source_map, query_cache)
            target_viz = _copy_visualization(template_viz, target_query)

            new_widget = Widget(
                dashboard=target_dashboard,
                visualization=target_viz,
                text=widget.text or "",
                width=widget.width,
                options=new_options,
            )
        else:
            # Text-only widget
            new_widget = Widget(
                dashboard=target_dashboard,
                visualization=None,
                text=widget.text or "",
                width=widget.width,
                options=new_options,
            )

        db.session.add(new_widget)
        bottom = row + position.get("sizeY", 1)
        if bottom > max_bottom:
            max_bottom = bottom

    return max_bottom
