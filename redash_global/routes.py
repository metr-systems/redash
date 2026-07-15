from flask import Blueprint

from redash_global.views.auth import login_page, logout_page
from redash_global.views.index import index_view

global_blueprint = Blueprint("global", __name__)

global_blueprint.add_url_rule("/", methods=["GET"], view_func=index_view, endpoint="index")
global_blueprint.add_url_rule("/login", methods=["GET", "POST"], view_func=login_page, endpoint="login")
global_blueprint.add_url_rule("/logout", methods=["GET"], view_func=logout_page, endpoint="logout")
