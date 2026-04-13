"""Dashboard views for Redash Global service."""

import os

from flask import jsonify, request
from flask_login import current_user, login_required

from redash.models.base import db
from redash_global.models import (
    ComposedDashboard,
    ComposedDashboardAssignment,
    ComposedDashboardEntry,
    SubDashboardAssignment,
)


@login_required
def config_view():
    """Return frontend configuration including the Redash base URL."""
    return jsonify({"redash_url": os.environ.get("REDASH_URL", "").rstrip("/")})


@login_required
def composed_dashboards_create():
    """Create a new composed dashboard."""
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    dashboard = ComposedDashboard(
        name=name,
        description=data.get("description", ""),
        admin_user_id=current_user.id,
    )
    db.session.add(dashboard)
    db.session.commit()
    return jsonify(dashboard.to_dict()), 201


@login_required
def template_dashboard_get(dashboard_id):
    """Get a single dashboard from the _template organization by id."""
    from redash import models

    redash_url = os.environ.get("REDASH_URL", "").rstrip("/")
    sub = models.Dashboard.query.get(dashboard_id)
    if sub is None:
        return jsonify({"error": "Not found"}), 404

    d_dict = sub.to_dict()
    d_dict["url"] = f"{redash_url}/_template/dashboard/{sub.slug}"
    return jsonify(d_dict)


@login_required
def template_dashboards_list():
    """List dashboards from the _template organization, paginated, with optional search."""
    from redash import models

    TEMPLATE_ORG_SLUG = "_template"
    org = models.Organization.get_by_slug(TEMPLATE_ORG_SLUG)
    if not org:
        return jsonify({"count": 0, "page": 1, "page_size": 25, "results": []}), 200

    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 25))
    search_term = request.args.get("q", "").strip()

    redash_url = os.environ.get("REDASH_URL", "").rstrip("/")

    query = models.Dashboard.query.filter(
        models.Dashboard.org == org,
        models.Dashboard.is_archived.is_(False),
        models.Dashboard.is_draft.is_(False),
    )

    if search_term:
        query = query.filter(models.Dashboard.name.ilike(f"%{search_term}%"))

    order = request.args.get("order", "-created_at")
    if order.startswith("-"):
        field = order[1:]
        query = query.order_by(getattr(models.Dashboard, field, models.Dashboard.created_at).desc())
    else:
        query = query.order_by(getattr(models.Dashboard, order, models.Dashboard.created_at).asc())

    total_count = query.count()
    dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for d in dashboards:
        d_dict = d.to_dict()
        d_dict["url"] = f"{redash_url}/_template/dashboard/{d.slug}"
        results.append(d_dict)

    return jsonify(
        {
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": results,
        }
    )


@login_required
def composed_dashboards_list():
    """List all composed dashboards, paginated, with optional search."""
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 25))
    search_term = request.args.get("q", "").strip()

    query = ComposedDashboard.query

    if search_term:
        query = query.filter(ComposedDashboard.name.ilike(f"%{search_term}%"))

    order = request.args.get("order", "-created_at")
    if order.startswith("-"):
        field = order[1:]
        query = query.order_by(getattr(ComposedDashboard, field, ComposedDashboard.created_at).desc())
    else:
        query = query.order_by(getattr(ComposedDashboard, order, ComposedDashboard.created_at).asc())

    total_count = query.count()
    dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    return jsonify(
        {
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": [d.to_dict() for d in dashboards],
        }
    )


@login_required
def composed_dashboard_get(dashboard_id):
    """Get a single composed dashboard."""
    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404
    return jsonify(dashboard.to_dict())


@login_required
def composed_dashboard_entries_list(dashboard_id):
    """List entries for a composed dashboard, ordered, with sub-dashboard details."""
    from redash import models

    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    redash_url = os.environ.get("REDASH_URL", "").rstrip("/")

    results = []
    for entry in dashboard.entries:
        sub = models.Dashboard.query.get(entry.dashboard_id)
        if sub is None:
            continue
        results.append(
            {
                "entry_id": entry.id,
                "order_index": entry.order_index,
                "dashboard_id": entry.dashboard_id,
                "name": sub.name,
                "slug": sub.slug,
                "url": f"{redash_url}/_template/dashboard/{sub.slug}",
            }
        )

    return jsonify(results)


@login_required
def composed_dashboard_entries_reorder(dashboard_id):
    """Reorder entries for a composed dashboard.

    Expects JSON body: {"entry_ids": [<id>, <id>, ...]}
    The position in the list determines the new order_index (0-based).
    """
    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(force=True) or {}
    entry_ids = data.get("entry_ids")
    if not isinstance(entry_ids, list):
        return jsonify({"error": "entry_ids must be a list"}), 400

    entries_by_id = {e.id: e for e in dashboard.entries}
    for new_index, entry_id in enumerate(entry_ids):
        entry = entries_by_id.get(entry_id)
        if entry is None:
            return jsonify({"error": f"Entry {entry_id} not found in this dashboard"}), 400
        entry.order_index = new_index

    db.session.commit()
    return jsonify({"ok": True})


@login_required
def composed_dashboard_entries_add(dashboard_id):
    """Add a sub-dashboard entry to a composed dashboard.

    Expects JSON body: {"dashboard_id": <int>}
    The new entry is appended at the end (highest order_index + 1).
    """
    from redash import models

    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(force=True) or {}
    sub_id = data.get("dashboard_id")
    if not sub_id:
        return jsonify({"error": "dashboard_id is required"}), 400

    sub = models.Dashboard.query.get(sub_id)
    if sub is None:
        return jsonify({"error": "Dashboard not found"}), 404

    existing_ids = {e.dashboard_id for e in dashboard.entries}
    if sub_id in existing_ids:
        return jsonify({"error": "Already added"}), 409

    next_index = max((e.order_index for e in dashboard.entries), default=-1) + 1
    entry = ComposedDashboardEntry(
        composed_dashboard_id=dashboard_id,
        dashboard_id=sub_id,
        order_index=next_index,
    )
    db.session.add(entry)
    db.session.commit()

    redash_url = os.environ.get("REDASH_URL", "").rstrip("/")
    return (
        jsonify(
            {
                "entry_id": entry.id,
                "order_index": entry.order_index,
                "dashboard_id": entry.dashboard_id,
                "name": sub.name,
                "slug": sub.slug,
                "url": f"{redash_url}/_template/dashboard/{sub.slug}",
            }
        ),
        201,
    )


@login_required
def composed_dashboard_entry_delete(dashboard_id, entry_id):
    """Remove a single entry from a composed dashboard."""
    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    entry = ComposedDashboardEntry.query.filter_by(id=entry_id, composed_dashboard_id=dashboard_id).first()
    if entry is None:
        return jsonify({"error": "Entry not found"}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"ok": True})


# ─── Assignment endpoints ─────────────────────────────────────────────────────


@login_required
def organizations_list():
    """List all organizations available for assignment."""
    from redash import models

    orgs = models.Organization.query.order_by(models.Organization.name).all()
    return jsonify([{"id": o.id, "name": o.name, "slug": o.slug} for o in orgs])


@login_required
def composed_dashboard_assignments_list(dashboard_id):
    """List organizations this composed dashboard is assigned to."""
    from redash import models

    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    results = []
    for assignment in dashboard.assignments:
        org = models.Organization.query.get(assignment.organization_id)
        if org is None:
            continue
        results.append(
            {
                "assignment_id": assignment.id,
                "organization_id": org.id,
                "organization_name": org.name,
                "organization_slug": org.slug,
            }
        )

    return jsonify(results)


@login_required
def composed_dashboard_assignments_add(dashboard_id):
    """Assign a composed dashboard to an organization.

    Expects JSON body: {"organization_id": <int>}
    The actual deployment logic (copying layouts into the client org) is a stub.
    """
    from redash import models

    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(force=True) or {}
    org_id = data.get("organization_id")
    if not org_id:
        return jsonify({"error": "organization_id is required"}), 400

    org = models.Organization.query.get(org_id)
    if org is None:
        return jsonify({"error": "Organization not found"}), 404

    existing = ComposedDashboardAssignment.query.filter_by(
        composed_dashboard_id=dashboard_id, organization_id=org_id
    ).first()
    if existing:
        return jsonify({"error": "Already assigned"}), 409

    assignment = ComposedDashboardAssignment(
        composed_dashboard_id=dashboard_id,
        organization_id=org_id,
    )
    db.session.add(assignment)
    db.session.commit()

    # TODO: deployment logic — copy layouts from sub-dashboards into client org
    print(f"[STUB] Deploying composed dashboard {dashboard_id} ({dashboard.name}) to org {org_id} ({org.slug})")

    return (
        jsonify(
            {
                "assignment_id": assignment.id,
                "organization_id": org.id,
                "organization_name": org.name,
                "organization_slug": org.slug,
            }
        ),
        201,
    )


@login_required
def composed_dashboard_assignment_delete(dashboard_id, assignment_id):
    """Remove the assignment of a composed dashboard from an organization."""
    dashboard = ComposedDashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({"error": "Not found"}), 404

    assignment = ComposedDashboardAssignment.query.filter_by(
        id=assignment_id, composed_dashboard_id=dashboard_id
    ).first()
    if assignment is None:
        return jsonify({"error": "Assignment not found"}), 404

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({"ok": True})


# ─── Sub-dashboard assignment endpoints ──────────────────────────────────────


@login_required
def sub_dashboard_assignments_list(dashboard_id):
    """List organizations this sub-dashboard is assigned to."""
    from redash import models

    sub = models.Dashboard.query.get(dashboard_id)
    if sub is None:
        return jsonify({"error": "Not found"}), 404

    assignments = SubDashboardAssignment.query.filter_by(dashboard_id=dashboard_id).all()
    results = []
    for assignment in assignments:
        org = models.Organization.query.get(assignment.organization_id)
        if org is None:
            continue
        results.append(
            {
                "assignment_id": assignment.id,
                "organization_id": org.id,
                "organization_name": org.name,
                "organization_slug": org.slug,
            }
        )
    return jsonify(results)


@login_required
def sub_dashboard_assignments_add(dashboard_id):
    """Assign a sub-dashboard to an organization.

    Expects JSON body: {"organization_id": <int>}
    """
    from redash import models

    sub = models.Dashboard.query.get(dashboard_id)
    if sub is None:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(force=True) or {}
    org_id = data.get("organization_id")
    if not org_id:
        return jsonify({"error": "organization_id is required"}), 400

    org = models.Organization.query.get(org_id)
    if org is None:
        return jsonify({"error": "Organization not found"}), 404

    existing = SubDashboardAssignment.query.filter_by(dashboard_id=dashboard_id, organization_id=org_id).first()
    if existing:
        return jsonify({"error": "Already assigned"}), 409

    assignment = SubDashboardAssignment(
        dashboard_id=dashboard_id,
        organization_id=org_id,
    )
    db.session.add(assignment)
    db.session.commit()

    return (
        jsonify(
            {
                "assignment_id": assignment.id,
                "organization_id": org.id,
                "organization_name": org.name,
                "organization_slug": org.slug,
            }
        ),
        201,
    )


@login_required
def sub_dashboard_assignment_delete(dashboard_id, assignment_id):
    """Remove the assignment of a sub-dashboard from an organization."""
    from redash import models

    sub = models.Dashboard.query.get(dashboard_id)
    if sub is None:
        return jsonify({"error": "Not found"}), 404

    assignment = SubDashboardAssignment.query.filter_by(id=assignment_id, dashboard_id=dashboard_id).first()
    if assignment is None:
        return jsonify({"error": "Assignment not found"}), 404

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({"ok": True})
