import logging

from flask import Blueprint, redirect, request, url_for

from redash.authentication import get_next_path
from redash.authentication.org_resolving import current_org
from redash.handlers.base import org_scoped_rule
from redash.settings import metr as metr_settings

logger = logging.getLogger("jwt_login")

blueprint = Blueprint("jwt_login", __name__)


@blueprint.route(org_scoped_rule("/jwt/login"))
def login(org_slug=None):
    next_path = get_next_path(request.args.get("next"))

    login_url = metr_settings.JWT_LOGIN_URL
    if not login_url:
        logger.error("Cannot start a JWT login without REDASH_JWT_LOGIN_URL being set")
        return redirect(url_for("redash.index", org_slug=org_slug, next=next_path or None))

    login_url = login_url.replace("{org_slug}", current_org.slug)
    resume_path = next_path or url_for("redash.index", org_slug=org_slug)

    return redirect(f"{login_url}?next={resume_path}", code=302)
