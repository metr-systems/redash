import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import talisman
from flask_wtf.csrf import CSRFProtect, generate_csrf

from redash import settings

csrf = CSRFProtect()

talisman = talisman.Talisman()

GLOBAL_THROTTLE_LOGIN_PATTERN = os.environ.get("GLOBAL_THROTTLE_LOGIN_PATTERN", "10/hour")

limiter = Limiter(key_func=get_remote_address, storage_uri=settings.LIMITER_STORAGE)


def init_app(app):
    csrf.init_app(app)
    app.config["WTF_CSRF_TIME_LIMIT"] = settings.CSRF_TIME_LIMIT
    app.config["SESSION_COOKIE_NAME"] = os.environ.get("GLOBAL_SESSION_COOKIE_NAME", "global_admin_session")
    app.config["RATELIMIT_ENABLED"] = settings.RATELIMIT_ENABLED
    limiter.init_app(app)

    # Hand the SPA a readable CSRF token, mirroring redash/security.py. CSRFProtect
    # is already active (WTF_CSRF_CHECK_DEFAULT defaults to True), so it enforces the
    # X-CSRFToken header on the write endpoints; the SPA reads this non-HttpOnly
    # cookie and echoes it back.
    @app.after_request
    def inject_csrf_token(response):
        response.set_cookie("csrf_token", generate_csrf())
        return response

    # Transport/header hardening, mirroring redash/security.py so the global
    # admin surface gets the same Secure/HttpOnly cookie flags, HTTPS + HSTS
    # enforcement, frame-options, CSP, and referrer policy as the main app.
    talisman.init_app(
        app,
        feature_policy=settings.FEATURE_POLICY,
        force_https=settings.ENFORCE_HTTPS,
        force_https_permanent=settings.ENFORCE_HTTPS_PERMANENT,
        force_file_save=settings.ENFORCE_FILE_SAVE,
        frame_options=settings.FRAME_OPTIONS,
        frame_options_allow_from=settings.FRAME_OPTIONS_ALLOW_FROM,
        strict_transport_security=settings.HSTS_ENABLED,
        strict_transport_security_preload=settings.HSTS_PRELOAD,
        strict_transport_security_max_age=settings.HSTS_MAX_AGE,
        strict_transport_security_include_subdomains=settings.HSTS_INCLUDE_SUBDOMAINS,
        content_security_policy=settings.CONTENT_SECURITY_POLICY,
        content_security_policy_report_uri=settings.CONTENT_SECURITY_POLICY_REPORT_URI,
        content_security_policy_report_only=settings.CONTENT_SECURITY_POLICY_REPORT_ONLY,
        content_security_policy_nonce_in=settings.CONTENT_SECURITY_POLICY_NONCE_IN,
        referrer_policy=settings.REFERRER_POLICY,
        session_cookie_secure=settings.SESSION_COOKIE_SECURE,
        session_cookie_http_only=settings.SESSION_COOKIE_HTTPONLY,
    )
