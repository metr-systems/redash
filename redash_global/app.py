import os
from pathlib import Path

from flask import Flask
from jinja2 import ChoiceLoader, FileSystemLoader

import redash
from redash import settings
from redash.handlers.webpack import configure_webpack
from redash.models.base import db
from redash_global import security
from redash_global.views.auth import login_manager

GLOBAL_TEMPLATE_PATH = Path(__file__).parent / "templates"
REDASH_TEMPLATE_PATH = Path(redash.__file__).parent / "templates"


def _validate_required_config():
    """Fail fast at startup if security-critical config is missing."""
    if not os.environ.get("GLOBAL_SECRET_KEY"):
        raise Exception(
            "You must set the GLOBAL_SECRET_KEY environment variable to run "
            "Redash Global. It signs the global-admin session cookie and must "
            "differ from the main Redash app's secret."
        )


def create_global_app():
    """Create and configure the Redash Global Flask application."""
    _validate_required_config()

    app = Flask(
        __name__,
        static_folder=settings.STATIC_ASSETS_PATH,
        static_url_path="/static",
    )

    # Reuse Redash's database connection — single shared PostgreSQL database,
    # no second connection pool, full access to the existing models later on.
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Secret used to sign the session cookie. A dedicated secret keeps Redash
    # Global sessions cryptographically independent from the main Redash app.
    app.config["SECRET_KEY"] = os.environ["GLOBAL_SECRET_KEY"]

    # Load Redash Global's own templates first, falling back to Redash's
    # templates so pages can extend shared layouts (e.g. signed_out.html).
    app.jinja_loader = ChoiceLoader(
        [
            FileSystemLoader(GLOBAL_TEMPLATE_PATH),
            FileSystemLoader(REDASH_TEMPLATE_PATH),
        ]
    )

    db.init_app(app)
    security.init_app(app)
    login_manager.init_app(app)
    configure_webpack(app)

    from redash_global.routes import global_blueprint

    app.register_blueprint(global_blueprint)

    from redash_global.cli import create_global_admin, update_global_admin_password

    app.cli.add_command(create_global_admin)
    app.cli.add_command(update_global_admin_password)

    return app
