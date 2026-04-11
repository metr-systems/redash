"""API routes for Redash Global service."""

from flask import Blueprint

from redash_global.views.auth import (
    admin_ui_catchall,
    admin_ui_view,
    login_page,
    logout_view,
)
from redash_global.views.dashboards import (
    composed_dashboards_create,
    composed_dashboards_list,
    sub_dashboard_get,
    sub_dashboard_update,
    sub_dashboards_create,
    sub_dashboards_list,
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

# SubDashboard (template dashboards, org-independent)
api_blueprint.add_url_rule(
    "/dashboards", methods=["GET"], view_func=sub_dashboards_list, endpoint="sub_dashboards_list"
)
api_blueprint.add_url_rule(
    "/dashboards", methods=["POST"], view_func=sub_dashboards_create, endpoint="sub_dashboards_create"
)
api_blueprint.add_url_rule(
    "/dashboards/<int:dashboard_id>", methods=["GET"], view_func=sub_dashboard_get, endpoint="sub_dashboard_get"
)
api_blueprint.add_url_rule(
    "/dashboards/<int:dashboard_id>", methods=["POST"], view_func=sub_dashboard_update, endpoint="sub_dashboard_update"
)
