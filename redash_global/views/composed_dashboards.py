from flask import jsonify, request
from flask_login import login_required

from redash.models import db
from redash_global.models import ComposedDashboard


def serialize(composed_dashboard):
    return {
        "id": composed_dashboard.id,
        "name": composed_dashboard.name,
        "url_identifier": composed_dashboard.url_identifier,
        "created_at": composed_dashboard.created_at,
        "updated_at": composed_dashboard.updated_at,
    }


@login_required
def composed_dashboards_list():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 25))

    query = ComposedDashboard.query.order_by(ComposedDashboard.created_at.desc())

    total = query.count()
    composed_dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    return jsonify(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": [serialize(cd) for cd in composed_dashboards],
        }
    )


@login_required
def composed_dashboard_detail(composed_dashboard_id):
    composed_dashboard = ComposedDashboard.query.get_or_404(composed_dashboard_id)
    return jsonify(serialize(composed_dashboard))


@login_required
def composed_dashboard_create():
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    url_identifier = body.get("url_identifier")

    composed_dashboard = ComposedDashboard(name=name, url_identifier=url_identifier)
    db.session.add(composed_dashboard)
    db.session.commit()

    return jsonify(serialize(composed_dashboard)), 201


@login_required
def composed_dashboard_delete(composed_dashboard_id):
    composed_dashboard = ComposedDashboard.query.get_or_404(composed_dashboard_id)
    db.session.delete(composed_dashboard)
    db.session.commit()
    return "", 204
