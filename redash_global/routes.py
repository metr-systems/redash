"""API routes for Redash Global service."""

from flask import Blueprint

from redash_global.views.auth import (
    admin_ui_catchall,
    admin_ui_view,
    login_page,
    logout_view,
)
from redash_global.views.dashboards import (
    composed_dashboard_deploy_stream,
    composed_dashboard_deployment_delete,
    composed_dashboard_deployment_redeploy,
    composed_dashboard_deployments_add,
    composed_dashboard_deployments_list,
    composed_dashboard_entries_add,
    composed_dashboard_entries_list,
    composed_dashboard_entries_reorder,
    composed_dashboard_entry_delete,
    composed_dashboard_get,
    composed_dashboard_redeploy_stream,
    composed_dashboards_create,
    composed_dashboards_list,
    organizations_list,
    sub_dashboard_assignment_delete,
    sub_dashboard_assignments_add,
    sub_dashboard_assignments_list,
    template_dashboard_get,
    template_dashboards_list,
)

# Create API blueprint
api_blueprint = Blueprint("api", __name__, url_prefix="/global-api")

api_blueprint.add_url_rule("/admin/login", methods=["GET", "POST"], view_func=login_page, endpoint="login_page")
api_blueprint.add_url_rule("/admin/logout", methods=["GET"], view_func=logout_view, endpoint="logout")
api_blueprint.add_url_rule("/admin", methods=["GET"], view_func=admin_ui_view, endpoint="admin_ui")
api_blueprint.add_url_rule("/admin/", methods=["GET"], view_func=admin_ui_catchall, endpoint="admin_ui_root")
api_blueprint.add_url_rule(
    "/admin/<path:path>", methods=["GET"], view_func=admin_ui_catchall, endpoint="admin_ui_catchall"
)

# Dashboard API endpoints
api_blueprint.add_url_rule(
    "/global-dashboards", methods=["GET"], view_func=composed_dashboards_list, endpoint="composed_dashboards_list"
)
api_blueprint.add_url_rule(
    "/global-dashboards", methods=["POST"], view_func=composed_dashboards_create, endpoint="composed_dashboards_create"
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>",
    methods=["GET"],
    view_func=composed_dashboard_get,
    endpoint="composed_dashboard_get",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/entries",
    methods=["GET"],
    view_func=composed_dashboard_entries_list,
    endpoint="composed_dashboard_entries_list",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/entries",
    methods=["POST"],
    view_func=composed_dashboard_entries_add,
    endpoint="composed_dashboard_entries_add",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/entries/<int:entry_id>",
    methods=["DELETE"],
    view_func=composed_dashboard_entry_delete,
    endpoint="composed_dashboard_entry_delete",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/entries/reorder",
    methods=["POST"],
    view_func=composed_dashboard_entries_reorder,
    endpoint="composed_dashboard_entries_reorder",
)
api_blueprint.add_url_rule(
    "/template-dashboards", methods=["GET"], view_func=template_dashboards_list, endpoint="template_dashboards_list"
)
api_blueprint.add_url_rule(
    "/template-dashboards/<int:dashboard_id>",
    methods=["GET"],
    view_func=template_dashboard_get,
    endpoint="template_dashboard_get",
)
api_blueprint.add_url_rule(
    "/organizations", methods=["GET"], view_func=organizations_list, endpoint="organizations_list"
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/deployments",
    methods=["GET"],
    view_func=composed_dashboard_deployments_list,
    endpoint="composed_dashboard_deployments_list",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/deployments",
    methods=["POST"],
    view_func=composed_dashboard_deployments_add,
    endpoint="composed_dashboard_deployments_add",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/deployments/<int:deployment_id>",
    methods=["DELETE"],
    view_func=composed_dashboard_deployment_delete,
    endpoint="composed_dashboard_deployment_delete",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/deployments/<int:deployment_id>/redeploy",
    methods=["POST"],
    view_func=composed_dashboard_deployment_redeploy,
    endpoint="composed_dashboard_deployment_redeploy",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/deployments/stream",
    methods=["POST"],
    view_func=composed_dashboard_deploy_stream,
    endpoint="composed_dashboard_deploy_stream",
)
api_blueprint.add_url_rule(
    "/global-dashboards/<int:dashboard_id>/deployments/<int:deployment_id>/redeploy-stream",
    methods=["POST"],
    view_func=composed_dashboard_redeploy_stream,
    endpoint="composed_dashboard_redeploy_stream",
)
api_blueprint.add_url_rule(
    "/sub-dashboards/<int:dashboard_id>/assignments",
    methods=["GET"],
    view_func=sub_dashboard_assignments_list,
    endpoint="sub_dashboard_assignments_list",
)
api_blueprint.add_url_rule(
    "/sub-dashboards/<int:dashboard_id>/assignments",
    methods=["POST"],
    view_func=sub_dashboard_assignments_add,
    endpoint="sub_dashboard_assignments_add",
)
api_blueprint.add_url_rule(
    "/sub-dashboards/<int:dashboard_id>/assignments/<int:assignment_id>",
    methods=["DELETE"],
    view_func=sub_dashboard_assignment_delete,
    endpoint="sub_dashboard_assignment_delete",
)
