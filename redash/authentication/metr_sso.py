"""
Single sign-on from core-backend.

Not to be confused with redash.authentication.jwt_auth, which is Redash's support
for identity-aware proxies -- Cloudflare Access, Google IAP. Those sit in front of
Redash and inject a token on every request, so Redash reads one per request, keeps
no session of its own and never logs anybody out: the proxy owns all of that. This
is a hand-off between siblings. core-backend mints one token, we spend it for a
session of ours, and the token is then gone.

The two share exactly one thing: the signature check in jwt_auth. The login button,
the callback, the tenant claim and the group new arrivals land in have no
counterpart upstream, which is why they live here rather than as changes to it.
"""

import logging

import jwt
from flask import Blueprint, redirect, request, session, url_for
from flask_login import login_user, logout_user

from redash import models
from redash.authentication import (
    create_and_login_user,
    get_login_url,
    get_next_path,
    jwt_auth,
)
from redash.authentication.org_resolving import current_org
from redash.handlers.base import org_scoped_rule
from redash.security import csrf
from redash.settings import metr as metr_settings

logger = logging.getLogger(__name__)

blueprint = Blueprint("metr_sso", __name__)


class MisconfiguredError(Exception):
    """Raised when these settings cannot describe a safe deployment."""


def is_enabled():
    return bool(metr_settings.SSO_LOGIN_URL)


def login_url_for(org):
    """The tenant's own core-backend, the only host holding a session for them."""
    return metr_settings.SSO_LOGIN_URL.replace("{org_slug}", org.slug)


def jwks_url_for(org):
    """
    Where that tenant publishes the key its tickets are signed with.

    One deployment-wide setting serves every organization, so the URL may name the
    organization rather than pinning one of them for all the others to depend on.
    """
    return metr_settings.SSO_CALLBACK_JWKS_URL.replace("{org_slug}", org.slug)


def read_the_ticket(org, ticket):
    """
    Return the user a ticket names, or None when it names nobody we will accept.

    Never raises for a bad ticket. A ticket rides on a cookie the browser sends to
    every host under the domain we share with the identity provider, so it may be
    stale, or minted by another deployment altogether. One we cannot use is no
    credential rather than a failed authentication, and its bearer should meet the
    login page rather than an error.
    """
    try:
        claims, ticket_is_valid = jwt_auth.verify_jwt_token(
            ticket,
            expected_issuer=metr_settings.SSO_ISSUER,
            expected_audience=metr_settings.SSO_AUDIENCE,
            algorithms=metr_settings.SSO_ALGORITHMS,
            public_certs_url=jwks_url_for(org),
        )
    except OSError as error:
        # Reading the keys can fail over the network or off disk. requests raises
        # subclasses of OSError, so a name that does not resolve and a file that is
        # not there arrive together.
        logger.warning("Could not read the signing keys for %r: %s", org.slug, error)
        return None
    except jwt.PyJWTError as error:
        # The key id is read before any key is tried, so a ticket too malformed to
        # parse at all escapes the verification loop rather than failing inside it.
        logger.info("Could not read the ticket: %s", error)
        return None

    if not ticket_is_valid or not claims:
        logger.info("Refusing a ticket that does not verify")
        return None

    if "email" not in claims:
        logger.info("Refusing a ticket that names no email")
        return None

    named_tenant = claims.get(metr_settings.SSO_TENANT_CLAIM)
    if named_tenant != org.slug:
        logger.info(
            "Ticket was issued for %r, not for organization %r, refusing to login",
            named_tenant,
            org.slug,
        )
        return None

    try:
        user = models.User.get_by_email_and_org(claims["email"], org)
        if user.is_disabled:
            # create_and_login_user refuses a disabled user; looking one up has to
            # refuse them too, or being disabled in Redash would stop nothing.
            logger.info("Refusing a ticket for %r, who is disabled here", user.email)
            return None
        return user
    except models.NoResultFound:
        # Just-in-time provisioning, into a group of this feature's own rather than
        # the default one, which can read every data source in the organization.
        return create_and_login_user(
            org,
            claims["email"],
            claims["email"],
            group_ids=[org.get_or_create_sso_group().id],
        )


def clear_the_ticket(response):
    """Spent or refused, the browser should stop carrying it."""
    if metr_settings.SSO_COOKIE_NAME:
        response.delete_cookie(
            metr_settings.SSO_COOKIE_NAME,
            domain=metr_settings.SSO_COOKIE_DOMAIN or None,
        )
    return response


@blueprint.route(org_scoped_rule("/metr/login"))
def login(org_slug=None):
    """Send the visitor to their own tenant to authenticate."""
    next_path = get_next_path(request.args.get("next"))
    resume_path = next_path or url_for("redash.index", org_slug=org_slug)

    if not is_enabled():
        logger.error("Cannot start a login without REDASH_METR_SSO_LOGIN_URL being set")
        return redirect(resume_path)

    return redirect(f"{login_url_for(current_org)}?next={resume_path}")


@blueprint.route(org_scoped_rule("/metr/callback"))
def callback(org_slug=None):
    """
    Spend a ticket: exchange it for a session of our own, then delete it.

    The exchange is what makes logging out mean anything, and it settles who the
    visitor is. A session outranks anything a request carries, so without it a
    visitor already signed in as somebody else would keep that identity and the
    hand-off would be ignored -- until they logged out, when the ticket would take
    over and they would become the other person.
    """
    next_path = get_next_path(request.args.get("next"))
    org = current_org._get_current_object()

    ticket = request.cookies.get(metr_settings.SSO_COOKIE_NAME) if metr_settings.SSO_COOKIE_NAME else None
    if not ticket:
        # Worth saying out loud: without it this is the one way through here that
        # leaves no trace, and it looks exactly like a ticket we refused.
        logger.info("No hand-off ticket on the request, sending %r to the login page", org.slug)
        return clear_the_ticket(redirect(get_login_url(next=next_path or None)))

    user = read_the_ticket(org, ticket)
    if user is None:
        return clear_the_ticket(redirect(get_login_url(next=next_path or None)))

    # Logged on the way past because the refusals are all accounted for and the
    # successes were not, which left "it signed in somebody else" with nothing in
    # the log to distinguish it from "it refused the ticket".
    signed_in_before = session.get("_user_id")
    if signed_in_before != user.get_id():
        # Sign the previous visitor out before signing this one in. Logging in over
        # the top replaces the session but leaves everything else the browser is
        # carrying for them -- notably the remember cookie, which login_user only
        # touches when it is asked to remember somebody. That leftover is enough to
        # put the previous visitor back on the very next request, which is what made
        # arriving here look like it had been ignored.
        if signed_in_before is not None:
            logout_user()
        login_user(user)
        logger.info(
            "Spent a ticket for %r in %r, replacing session %r",
            user.email,
            org.slug,
            signed_in_before,
        )
    else:
        logger.info("Ticket for %r in %r names the session already here", user.email, org.slug)

    destination = next_path or url_for("redash.index", org_slug=org_slug)
    logger.info("Sending %r on to %r", user.email, destination)
    return clear_the_ticket(redirect(destination))


def init_app(app):
    """
    Wire the hand-off up, and refuse to start on a configuration that cannot work.

    The tenant claim is the only thing binding a ticket to one organization, and the
    comparison is skipped when the claim is not named, so leaving it unset would
    remove the isolation with no error and nothing in the log to notice.
    """
    if metr_settings.LEGACY_JWT_LOGIN_URL and not is_enabled():
        raise MisconfiguredError(
            "REDASH_JWT_LOGIN_URL is set but REDASH_METR_SSO_LOGIN_URL is not. This "
            "feature no longer borrows Redash's own REDASH_JWT_* settings, which "
            "belong to its support for identity-aware proxies. Rename them to "
            "REDASH_METR_SSO_*."
        )

    if is_enabled() and not metr_settings.SSO_TENANT_CLAIM:
        raise MisconfiguredError(
            "REDASH_METR_SSO_LOGIN_URL is set but REDASH_METR_SSO_TENANT_CLAIM is not. "
            "A ticket issued for one organization would be accepted at every other one. "
            "Set REDASH_METR_SSO_TENANT_CLAIM to the claim naming the tenant, e.g. 'tenant'."
        )

    # Registered whether or not the hand-off is configured, the way the other
    # providers are: the routes turn the visitor away themselves, and the login page
    # is told there is no URL to offer.
    csrf.exempt(blueprint)
    app.register_blueprint(blueprint)
    app.jinja_env.globals["metr_sso_login_url"] = _login_url_for_the_login_page


def _login_url_for_the_login_page():
    if not is_enabled():
        return None
    return url_for(
        "metr_sso.login",
        org_slug=current_org.slug,
        next=get_next_path(request.args.get("next")) or None,
    )
