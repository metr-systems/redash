from flask import jsonify
from flask_login import login_required

from redash import models


def _serialize(org):
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
    }


@login_required
def organizations_list():
    orgs = models.Organization.query.order_by(models.Organization.name).all()
    return jsonify([_serialize(o) for o in orgs])
