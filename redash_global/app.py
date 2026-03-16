"""Flask application factory for Redash Global service."""

from flask import Flask

# Import models to ensure they are registered with SQLAlchemy
# Import Redash database and models
from redash import settings
from redash.models.base import db


def create_global_app():
    """Create and configure the Redash Global Flask application."""
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
