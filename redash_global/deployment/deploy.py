from collections import namedtuple
from copy import deepcopy
from datetime import datetime, timezone

from redash.models import (
    Dashboard,
    DashboardGroup,
    Group,
    MetrDashboard,
    MetrDataSource,
    MetrQuery,
    Query,
    Visualization,
    Widget,
    db,
    metrWidget,
)
from redash.tasks.queries import enqueue_query
from redash_global.deployment.exceptions import DeploymentError
from redash_global.deployment.utils import widgets_with_query
from redash_global.deployment.validations import validate_composed_dashboard
from redash_global.models import ComposedDashboardDeployment, SubDashboardAssignment

DeploymentResult = namedtuple("DeploymentResult", ["composed_dashboard", "org", "error"])


def resolve_query_dropdown_dependencies(options, target_org, deploy_user, data_source_map, query_id_map):
    """Resolve query-based parameter dependencies before copying a query."""
    for parameter in options.get("parameters", []):
        if parameter.get("type") != "query":
            continue

        source_dep_id = parameter.get("queryId")
        if source_dep_id in query_id_map:
            parameter["queryId"] = query_id_map[source_dep_id]
            continue

        dependency_query = Query.query.get(source_dep_id)
        copied_dependency = get_or_copy_query(dependency_query, target_org, deploy_user, data_source_map, query_id_map)
        query_id_map[source_dep_id] = copied_dependency.id
        parameter["queryId"] = copied_dependency.id


def deploy_composed_dashboard(composed_dashboard, target_orgs):
    """Deploy/redeploy one composed dashboard to every target org.

    Each org is independent: one failing does not affect the rest, or roll back an org that
    already succeeded.
    """
    return [deploy_to_target_org(composed_dashboard, target_org) for target_org in target_orgs]


def ordered_org_assigned_subdashboard(composed_dashboard, target_org):
    """The composed dashboard's entries, filtered to those assigned to target_org, in order_index order."""
    assigned_ids = {
        assignment.dashboard_id for assignment in SubDashboardAssignment.query.filter_by(organization_id=target_org.id)
    }
    return [
        Dashboard.query.get(entry.template_dashboard_id)
        for entry in composed_dashboard.entries
        if entry.template_dashboard_id in assigned_ids
    ]


def deploy_to_target_org(composed_dashboard, target_org):
    try:
        sub_dashboards = ordered_org_assigned_subdashboard(composed_dashboard, target_org)
        validate_composed_dashboard(sub_dashboards, target_org)

        deploy_user = Group.members(target_org.admin_group.id).first()
        target_data_sources_map = get_target_data_sources(sub_dashboards, target_org)
        query_id_map = {}
        allowed_widgets_identifier = copy_allowed_widgets_query(
            sub_dashboards, target_org, deploy_user, target_data_sources_map, query_id_map
        )
        dashboard = get_or_create_dashboard(composed_dashboard, target_org, deploy_user, allowed_widgets_identifier)
        replace_widgets(dashboard, sub_dashboards, target_org, deploy_user, target_data_sources_map, query_id_map)
        record_deployment(composed_dashboard, target_org)

        db.session.commit()
        execute_query_parameter_dependencies(dashboard)
        return DeploymentResult(composed_dashboard, target_org, error=None)
    except DeploymentError as error:
        db.session.rollback()
        return DeploymentResult(composed_dashboard, target_org, error=error)


def get_target_data_sources(sub_dashboards, target_org):
    identifiers = set()
    for sub_dashboard in sub_dashboards:
        for widget in widgets_with_query(sub_dashboard):
            query = widget.visualization.query_rel
            if query.data_source_id is not None:
                metr_data_source = query.data_source.metr_data_source
                if metr_data_source is not None:
                    identifiers.add(metr_data_source.data_source_identifier)

            # Also collect data sources from parameter queries
            options = query.options or {}
            for parameter in options.get("parameters", []):
                if parameter.get("type") == "query":
                    param_query_id = parameter.get("queryId")
                    if param_query_id:
                        param_query = Query.query.get(param_query_id)
                        if param_query and param_query.data_source_id is not None:
                            param_metr_data_source = param_query.data_source.metr_data_source
                            if param_metr_data_source is not None:
                                identifiers.add(param_metr_data_source.data_source_identifier)

    return {
        metr_data_source.data_source_identifier: metr_data_source.data_source
        for metr_data_source in MetrDataSource.query.filter(
            MetrDataSource.org_id == target_org.id,
            MetrDataSource.data_source_identifier.in_(identifiers),
        )
    }


def get_or_copy_query(template_query, target_org, deploy_user, data_source_map, query_id_map=None):
    if query_id_map is None:
        query_id_map = {}

    options = deepcopy(template_query.options) if template_query.options else {}
    resolve_query_dropdown_dependencies(options, target_org, deploy_user, data_source_map, query_id_map)

    identifier = template_query.data_source.metr_data_source.data_source_identifier
    target_data_source = data_source_map[identifier]

    metr_query = (
        db.session.query(MetrQuery)
        .filter(MetrQuery.org_id == target_org.id, MetrQuery.template_query_id == template_query.id)
        .first()
    )
    if metr_query:
        query = metr_query.query
        query.name = template_query.name
        query.query_text = template_query.query_text
        query.options = options
        query.data_source = target_data_source
        return query

    # Bare constructor, not Query.create(...): Query.create always adds a "Table" TABLE
    # visualization, which would collide with the visualization copy_widget/copy_allowed_widgets_query
    # already builds. Query.fork (redash/models/__init__.py:798-820) avoids the same collision
    # the same way.
    query = Query(
        org=target_org,
        data_source=target_data_source,
        user=deploy_user,
        name=template_query.name,
        query_text=template_query.query_text,
        options=options,
    )
    db.session.add(query)
    db.session.flush()
    db.session.add(MetrQuery(query=query, org_id=target_org.id, template_query_id=template_query.id))
    return query


def copy_allowed_widgets_query(sub_dashboards, target_org, deploy_user, data_source_map, query_id_map=None):
    if query_id_map is None:
        query_id_map = {}

    metr_dashboard = sub_dashboards[0].metr_dashboard
    identifier = metr_dashboard.allowed_widget_query_identifier if metr_dashboard else None
    if identifier is None:
        return None

    template_org = sub_dashboards[0].org
    template_query = (
        db.session.query(Query)
        .join(MetrQuery, MetrQuery.query_id == Query.id)
        .filter(MetrQuery.org_id == template_org.id, MetrQuery.query_identifier == identifier)
        .first()
    )

    query = get_or_copy_query(template_query, target_org, deploy_user, data_source_map, query_id_map)
    query.metr_query.query_identifier = identifier
    return identifier


def copy_widget(template_widget, dashboard, target_org, deploy_user, data_source_map, row_offset, query_id_map=None):
    if query_id_map is None:
        query_id_map = {}

    options = deepcopy(template_widget.options) if template_widget.options else {}
    position = dict(options.get("position") or {})
    position["row"] = position.get("row", 0) + row_offset
    options["position"] = position

    visualization = None
    if template_widget.visualization_id is not None:
        template_query = template_widget.visualization.query_rel
        query = get_or_copy_query(template_query, target_org, deploy_user, data_source_map, query_id_map)
        visualization = Visualization(
            query_rel=query,
            type=template_widget.visualization.type,
            name=template_widget.visualization.name,
            description=template_widget.visualization.description,
            options=deepcopy(template_widget.visualization.options) if template_widget.visualization.options else None,
        )
        db.session.add(visualization)
        db.session.flush()

    widget = Widget(
        dashboard=dashboard,
        visualization=visualization,
        text=template_widget.text,
        width=template_widget.width,
        options=options,
    )
    db.session.add(widget)
    db.session.flush()

    template_metr_widget = template_widget.metr_widget
    if template_metr_widget and template_metr_widget.tags:
        db.session.add(metrWidget(widget=widget, tags=list(template_metr_widget.tags)))

    return widget


def delete_orphaned_visualizations(visualization_ids):
    for visualization_id in visualization_ids:
        visualization = Visualization.query.get(visualization_id)
        if visualization is None or Widget.query.filter_by(visualization_id=visualization_id).first() is not None:
            continue
        query = visualization.query_rel
        db.session.delete(visualization)
        db.session.flush()
        if not query.visualizations:
            db.session.delete(query)
    db.session.flush()


def replace_widgets(dashboard, sub_dashboards, target_org, deploy_user, data_source_map, query_id_map=None):
    if query_id_map is None:
        query_id_map = {}

    old_widgets = dashboard.widgets.all()
    old_visualization_ids = {widget.visualization_id for widget in old_widgets if widget.visualization_id is not None}
    for widget in old_widgets:
        db.session.delete(widget)
    db.session.flush()

    row_offset = 0
    for sub_dashboard in sub_dashboards:
        sub_dashboard_height = 0
        for template_widget in sub_dashboard.widgets:
            copy_widget(template_widget, dashboard, target_org, deploy_user, data_source_map, row_offset, query_id_map)
            position = (template_widget.options or {}).get("position") or {}
            sub_dashboard_height = max(sub_dashboard_height, position.get("row", 0) + position.get("sizeY", 0))
        row_offset += sub_dashboard_height

    # Anything from the old widget set that step above didn't recreate (the template dropped
    # that widget) is now genuinely orphaned.
    delete_orphaned_visualizations(old_visualization_ids)


def create_dashboard(composed_dashboard, target_org, deploy_user):
    dashboard = Dashboard(
        name=composed_dashboard.name,
        org=target_org,
        user=deploy_user,
        is_draft=False,
        layout=[],
    )
    db.session.add(dashboard)
    db.session.flush()
    db.session.add(DashboardGroup(dashboard=dashboard, group=target_org.default_group))
    db.session.add(
        MetrDashboard(
            dashboard=dashboard,
            org_id=target_org.id,
            url_identifier=composed_dashboard.url_identifier,
        )
    )
    db.session.flush()
    return dashboard


def get_or_create_dashboard(composed_dashboard, target_org, deploy_user, allowed_widgets_identifier):
    dashboard = (
        Dashboard.query.join(MetrDashboard, Dashboard.id == MetrDashboard.dashboard_id)
        .filter(
            MetrDashboard.url_identifier == composed_dashboard.url_identifier,
            MetrDashboard.org_id == target_org.id,
        )
        .first()
    )
    if dashboard:
        dashboard.name = composed_dashboard.name
    else:
        dashboard = create_dashboard(composed_dashboard, target_org, deploy_user)

    dashboard.metr_dashboard.allowed_widget_query_identifier = allowed_widgets_identifier
    return dashboard


def execute_query_parameter_dependencies(dashboard):
    executed_queries = set()

    for widget in dashboard.widgets:
        if widget.visualization_id:
            query = widget.visualization.query_rel
            for parameter in query.parameters:
                if parameter.get("type") == "query":
                    dep_query_id = parameter.get("queryId")
                    if dep_query_id and dep_query_id not in executed_queries:
                        dep_query = Query.query.get(dep_query_id)
                        if dep_query and dep_query.data_source:
                            try:
                                enqueue_query(
                                    dep_query.query_text,
                                    dep_query.data_source,
                                    dep_query.user_id,
                                    metadata={"query_id": dep_query.id},
                                )
                                executed_queries.add(dep_query_id)
                            except Exception:
                                pass


def record_deployment(composed_dashboard, target_org):
    deployment = ComposedDashboardDeployment.query.filter_by(
        composed_dashboard_id=composed_dashboard.id, organization_id=target_org.id
    ).first()
    if deployment is None:
        deployment = ComposedDashboardDeployment(
            composed_dashboard_id=composed_dashboard.id, organization_id=target_org.id
        )
        db.session.add(deployment)
    # A plain Python-side timestamp, not func.now(): this app's session uses
    # expire_on_commit=False, so a func.now() value would stay an unresolved SQL construct on
    # this attribute after commit instead of refreshing to the real value.
    deployment.last_deployed_at = datetime.now(timezone.utc)
