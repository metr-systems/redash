from flask import redirect, render_template, request, send_file
from flask_login import login_required
from werkzeug.utils import safe_join

from redash import models, settings
from redash.authentication.org_resolving import current_org
from redash.handlers import routes
from redash.handlers.authentication import base_href
from redash.handlers.base import org_scoped_rule
from redash.security import csp_allows_embeding


def render_index():
    if settings.MULTI_ORG:
        response = render_template("multi_org.html", base_href=base_href())
    else:
        full_path = safe_join(settings.STATIC_ASSETS_PATH, "index.html")
        response = send_file(full_path, **dict(max_age=0, conditional=True))

    return response


@routes.route(org_scoped_rule("/dashboard/<slug>"), methods=["GET"])
@login_required
@csp_allows_embeding
def dashboard(slug, org_slug=None):
    return render_index()


@routes.route(org_scoped_rule("/dashboards/by_url_identifier/<url_identifier>"), methods=["GET"])
@login_required
@csp_allows_embeding
def dashboard_by_url_identifier(url_identifier, org_slug):
    current_org_obj = current_org._get_current_object()
    dashboard = models.Dashboard.get_by_url_identifier_and_org_or_404(url_identifier, current_org_obj)

    # Redirect to canonical dashboard URL with org prefix, preserving query params
    # (e.g. ?p_Liegenschaft=...) since linked dashboards rely on them.
    canonical_path = f"/{org_slug}/dashboards/{dashboard.id}-{dashboard.slug}"
    query_string = request.query_string.decode("utf-8")
    if query_string:
        canonical_path = f"{canonical_path}?{query_string}"

    return redirect(canonical_path, code=302)


@routes.route(org_scoped_rule("/<path:path>"))
@routes.route(org_scoped_rule("/"))
@login_required
def index(**kwargs):
    return render_index()
