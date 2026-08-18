from flask import jsonify, request
from flask_login import login_required
from sqlalchemy.exc import IntegrityError

from redash.models import db
from redash_global.models import ComposedDashboard, ComposedDashboardEntry


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
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "A dashboard with this URL identifier already exists."}), 409

    return jsonify(serialize(composed_dashboard)), 201


@login_required
def composed_dashboard_delete(composed_dashboard_id):
    composed_dashboard = ComposedDashboard.query.get_or_404(composed_dashboard_id)
    db.session.delete(composed_dashboard)
    db.session.commit()
    return "", 204


def serialize_entry(entry):
    return {
        "id": entry.id,
        "composed_dashboard_id": entry.composed_dashboard_id,
        "template_dashboard_id": entry.template_dashboard_id,
        "order_index": entry.order_index,
    }


@login_required
def composed_dashboard_entries_list(composed_dashboard_id):
    composed_dashboard = ComposedDashboard.query.get_or_404(composed_dashboard_id)
    entries = composed_dashboard.entries
    return jsonify([serialize_entry(entry) for entry in entries])


@login_required
def composed_dashboard_entry_create(composed_dashboard_id):
    ComposedDashboard.query.get_or_404(composed_dashboard_id)
    body = request.get_json(silent=True) or {}
    template_dashboard_id = body.get("template_dashboard_id")

    max_order = (
        db.session.query(db.func.max(ComposedDashboardEntry.order_index))
        .filter(ComposedDashboardEntry.composed_dashboard_id == composed_dashboard_id)
        .scalar()
    )
    next_order = (max_order + 1) if max_order is not None else 0

    entry = ComposedDashboardEntry(
        composed_dashboard_id=composed_dashboard_id,
        template_dashboard_id=template_dashboard_id,
        order_index=next_order,
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify(serialize_entry(entry)), 201


@login_required
def composed_dashboard_entry_delete(composed_dashboard_id, entry_id):
    entry = ComposedDashboardEntry.query.filter_by(
        id=entry_id, composed_dashboard_id=composed_dashboard_id
    ).first_or_404()

    db.session.delete(entry)
    db.session.commit()
    return "", 204


@login_required
def composed_dashboard_entries_reorder(composed_dashboard_id):
    composed_dashboard = ComposedDashboard.query.get_or_404(composed_dashboard_id)
    body = request.get_json(silent=True) or {}
    entry_ids = body.get("entry_ids", [])

    for order_index, entry_id in enumerate(entry_ids):
        entry = ComposedDashboardEntry.query.filter_by(
            id=entry_id, composed_dashboard_id=composed_dashboard_id
        ).first_or_404()
        entry.order_index = order_index

    db.session.commit()
    return jsonify([serialize_entry(entry) for entry in composed_dashboard.entries])
