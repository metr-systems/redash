import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect

from redash import settings

csrf = CSRFProtect()

GLOBAL_THROTTLE_LOGIN_PATTERN = os.environ.get("GLOBAL_THROTTLE_LOGIN_PATTERN", "10/hour")

# Dedicated Limiter instance rather than reusing redash.limiter, to keep the
# two apps decoupled, but pointed at the same Redis storage so limits hold
# across processes/pods.
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.LIMITER_STORAGE)


def init_app(app):
    csrf.init_app(app)
    app.config["WTF_CSRF_TIME_LIMIT"] = settings.CSRF_TIME_LIMIT
    app.config["SESSION_COOKIE_NAME"] = os.environ.get("GLOBAL_SESSION_COOKIE_NAME", "global_admin_session")
    app.config["RATELIMIT_ENABLED"] = settings.RATELIMIT_ENABLED
    limiter.init_app(app)
