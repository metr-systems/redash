from flask import jsonify, request

from redash import models
from redash.handlers.base import BaseResource
from redash.permissions import require_permission
from redash.utils import slugify


class MetrQueryIdentifierValidationResource(BaseResource):
    """Resource for validating query identifier format and uniqueness."""

    @require_permission("edit_query")
    def post(self, query_id):
        query_identifier = request.get_json().get("query_identifier", None)

        # Validate format and uniqueness
        if not query_identifier:
            errors = ["Query identifier is required"]
        elif query_identifier != slugify(query_identifier):
            errors = ["Not a valid slug"]
        elif (
            models.db.session.query(models.MetrQuery)
            .filter(
                models.MetrQuery.org_id == self.current_org.id,
                models.MetrQuery.query_identifier == query_identifier,
                models.MetrQuery.query_id != query_id,
            )
            .first()
        ):
            errors = ["Already used query identifier"]
        else:
            errors = []

        return jsonify({"valid": not errors, "errors": errors})


class MetrQueryIdentifierListResource(BaseResource):
    """Lists the current org's non-null query identifiers (for the dashboard dropdown)."""

    @require_permission("list_dashboards")
    def get(self):
        rows = (
            models.db.session.query(models.MetrQuery)
            .filter(
                models.MetrQuery.org_id == self.current_org.id,
                models.MetrQuery.query_identifier.isnot(None),
            )
            .all()
        )
        return [
            {
                "query_identifier": row.query_identifier,
                "query_id": row.query_id,
                "name": row.query.name,
            }
            for row in rows
        ]
