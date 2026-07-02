from flask import Flask

from redash import settings
from redash.models.base import db


def create_global_app():
    """Create and configure the Redash Global Flask application."""
    app = Flask(
        __name__,
        static_folder=settings.STATIC_ASSETS_PATH,
        static_url_path="/static",
    )

    # Reuse Redash's database connection — single shared PostgreSQL database,
    # no second connection pool, full access to the existing models later on.
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    from redash_global.routes import global_blueprint

    app.register_blueprint(global_blueprint)

    return app
