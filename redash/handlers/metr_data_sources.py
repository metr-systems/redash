from flask import jsonify, request

from redash import models
from redash.handlers.base import BaseResource
from redash.permissions import require_admin
from redash.utils import slugify


class MetrDataSourceIdentifierValidationResource(BaseResource):
    @require_admin
    def post(self, data_source_id):
        data_source_identifier = request.get_json().get("data_source_identifier", None)

        # Validate format and uniqueness
        if not data_source_identifier:
            errors = ["Data source identifier is required"]
        elif data_source_identifier != slugify(data_source_identifier):
            errors = ["Not a valid slug"]
        elif (
            models.db.session.query(models.MetrDataSource)
            .filter(
                models.MetrDataSource.org_id == self.current_org.id,
                models.MetrDataSource.data_source_identifier == data_source_identifier,
                models.MetrDataSource.data_source_id != data_source_id,
            )
            .first()
        ):
            errors = ["Already used data source identifier"]
        else:
            errors = []

        return jsonify({"valid": not errors, "errors": errors})
