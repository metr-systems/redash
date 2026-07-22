from flask import Blueprint

from redash_global.views.auth import login_page, logout_page
from redash_global.views.index import index_view
from redash_global.views.organizations import organizations_list
from redash_global.views.subdashboards import sub_dashboards_list

global_blueprint = Blueprint("global", __name__)

global_blueprint.add_url_rule("/", methods=["GET"], view_func=index_view, endpoint="index")
global_blueprint.add_url_rule("/login", methods=["GET", "POST"], view_func=login_page, endpoint="login")
global_blueprint.add_url_rule("/logout", methods=["GET"], view_func=logout_page, endpoint="logout")

global_blueprint.add_url_rule(
    "/global-api/sub-dashboards",
    methods=["GET"],
    view_func=sub_dashboards_list,
    endpoint="sub_dashboards_list",
)

global_blueprint.add_url_rule(
    "/global-api/organizations",
    methods=["GET"],
    view_func=organizations_list,
    endpoint="organizations_list",
)
