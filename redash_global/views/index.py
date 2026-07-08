from flask import send_file
from werkzeug.utils import safe_join

from redash import settings


def index_view():
    full_path = safe_join(settings.STATIC_ASSETS_PATH, "global.html")
    return send_file(full_path, max_age=0, conditional=True)
