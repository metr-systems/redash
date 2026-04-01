"""API routes for Redash Global service."""

from flask import Blueprint

# Create API blueprint
api_blueprint = Blueprint("api", __name__, url_prefix="/global-api")

# Register routes
