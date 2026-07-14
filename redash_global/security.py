import os

from flask_wtf.csrf import CSRFProtect

from redash import settings

csrf = CSRFProtect()


def init_app(app):
    csrf.init_app(app)
    app.config["WTF_CSRF_TIME_LIMIT"] = settings.CSRF_TIME_LIMIT
    app.config["SESSION_COOKIE_NAME"] = os.environ.get("GLOBAL_SESSION_COOKIE_NAME", "global_admin_session")
