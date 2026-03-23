"""API routes for Redash Global service."""

from flask import Blueprint

from redash_global.views import create_organization_view

# Create API blueprint
api_blueprint = Blueprint("api", __name__, url_prefix="/global-api")

# Register routes
api_blueprint.add_url_rule(
    "/organizations", methods=["POST"], view_func=create_organization_view, endpoint="create_organization"
)
