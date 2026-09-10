import logging

from flask import Blueprint, redirect, request, session, url_for
from flask_login import login_user
from werkzeug.exceptions import Unauthorized

from redash.authentication import (
    clear_the_hand_off,
    get_login_url,
    get_next_path,
    load_user_from_jwt,
)
from redash.authentication.org_resolving import current_org
from redash.handlers.base import org_scoped_rule
from redash.settings import metr as metr_settings
from redash.settings.organization import settings as org_settings

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



@blueprint.route(org_scoped_rule("/jwt/callback"))
def callback(org_slug=None):
    """
    Spend a hand-off token: exchange it for a session of our own, then delete it.

    The exchange is what makes logging out mean anything. It also settles who the
    visitor is: a session already signed in as somebody else takes precedence over
    any token, so arriving here from the identity provider would otherwise leave the
    earlier person signed in and the hand-off silently ignored.
    """
    next_path = get_next_path(request.args.get("next"))

    cookie_name = org_settings["auth_jwt_auth_cookie_name"]
    jwt_token = request.cookies.get(cookie_name) if cookie_name else None

    user = None
    if jwt_token:
        try:
            user = load_user_from_jwt(current_org._get_current_object(), jwt_token)
        except Unauthorized:
            logger.warning("Refusing a hand-off token that does not verify")

    if user is None:
        return clear_the_hand_off(redirect(get_login_url(next=next_path or None)))

    if session.get("_user_id") != user.get_id():
        login_user(user)

    destination = next_path or url_for("redash.index", org_slug=org_slug)
    return clear_the_hand_off(redirect(destination))
