"""Flask application factory for Redash Global service."""

import os

from flask import Flask

# Import models to ensure they are registered with SQLAlchemy
# Import Redash database and models
from redash import settings
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

    app = Flask(__name__)

    # Essential database configuration (reuse Redash settings)
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize database with the app
    db.init_app(app)

    # Import and register routes
    from redash_global.routes import api_blueprint

    app.register_blueprint(api_blueprint)

    return app
