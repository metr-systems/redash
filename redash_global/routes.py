"""API routes for Redash Global service."""

from flask import Blueprint

from redash_global.views.auth import (
    admin_ui_catchall,
    admin_ui_view,
    login_page,
    logout_view,
)
from redash_global.views.dashboards import (
    global_dashboards_create,
    global_dashboards_list,
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
    "/global-dashboards", methods=["GET"], view_func=global_dashboards_list, endpoint="global_dashboards_list"
)
api_blueprint.add_url_rule(
    "/global-dashboards", methods=["POST"], view_func=global_dashboards_create, endpoint="global_dashboards_create"
)
