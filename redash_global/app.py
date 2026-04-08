"""Flask application factory for Redash Global service."""

import os

import jinja2
from flask import Flask
from flask_login import LoginManager

# Import Redash database and models
from redash import settings
from redash.handlers.webpack import configure_webpack
from redash.models.base import db


def _validate_required_config():
    """Validate required environment variables at startup."""
    required_env_vars = {"REDASH_GLOBAL_API_TOKEN": "Global API token for authentication"}

    for var_name, description in required_env_vars.items():
        if not os.environ.get(var_name):
            raise RuntimeError(
                f"Required environment variable '{var_name}' is not set. "
                f"This variable is needed for: {description}"
            )


def create_global_app():
    """Create and configure the Redash Global Flask application."""
    _validate_required_config()

    app = Flask(__name__, template_folder="templates")

    # Also load Redash templates (for layouts/signed_out.html etc.)
    redash_templates_path = os.path.join(os.path.dirname(__file__), "..", "redash", "templates")
    app.jinja_loader = jinja2.ChoiceLoader(
        [
            app.jinja_loader,
            jinja2.FileSystemLoader(os.path.normpath(redash_templates_path)),
            jinja2.FileSystemLoader(settings.FLASK_TEMPLATE_PATH),
        ]
    )

    # Essential database configuration (reuse Redash settings)
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = settings.SECRET_KEY

    # Initialize database with the app
    db.init_app(app)

    # Register webpack asset_url context processor (used by redash templates)
    configure_webpack(app)

    # Import models to register them with SQLAlchemy metadata
    from redash_global.models import GlobalAdminUser  # noqa: F401

    # Setup Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "api.login_page"

    @login_manager.user_loader
    def load_user(user_id):
        return GlobalAdminUser.query.get(int(user_id))

    # Import and register routes
    from redash_global.routes import api_blueprint

    app.register_blueprint(api_blueprint)

    # Register CLI commands
    from redash_global.cli import create_global_admin

    app.cli.add_command(create_global_admin)

    return app
