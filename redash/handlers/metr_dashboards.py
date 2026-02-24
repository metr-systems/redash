from flask import jsonify, request

from redash import models
from redash.handlers.base import BaseResource
from redash.permissions import require_permission
from redash.utils import slugify


class MetrDashboardUrlIdentifierValidationResource(BaseResource):
    """Resource for validating URL identifier format and uniqueness."""

    @require_permission("edit_dashboard")
    def post(self, dashboard_id):
        url_identifier = request.get_json().get("url_identifier", "")

        # Validate format and uniqueness
        if not url_identifier:
            errors = ["URL identifier is required"]
        elif url_identifier != slugify(url_identifier):
            errors = ["Not a valid slug"]
        elif models.MetrDashboard.query.filter(
            models.MetrDashboard.org_id == self.current_org.id,
            models.MetrDashboard.url_identifier == url_identifier,
            models.MetrDashboard.dashboard_id != dashboard_id,
        ).first():
            errors = ["Already used URL identifier"]
        else:
            errors = []

        return jsonify({"valid": not errors, "errors": errors})
