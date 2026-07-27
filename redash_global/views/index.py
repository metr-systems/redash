from flask import abort, send_file
from flask_login import login_required
from werkzeug.utils import safe_join

from redash import settings


def _serve_spa():
    full_path = safe_join(settings.STATIC_ASSETS_PATH, "global.html")
    return send_file(full_path, max_age=0, conditional=True)


@login_required
def index_view():
    return _serve_spa()


@login_required
def spa_catch_all(path):
    # Client-side routes (e.g. /sub-dashboards) have no server rule, so a hard
    # navigation or refresh would 404. Serve the SPA shell instead and let the
    # React router resolve the path. Unknown /global-api/ paths must still 404
    # rather than silently return HTML.
    if path.startswith("global-api/"):
        abort(404)
    return _serve_spa()
