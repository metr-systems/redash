"""Dashboard views for Redash Global service."""

import os

from flask import jsonify, request
from flask_login import current_user, login_required

from redash.models.base import db
from redash_global.models import ComposedDashboard


@login_required
def config_view():
    """Return frontend configuration including the Redash base URL."""
    return jsonify({"redash_url": os.environ.get("REDASH_URL", "").rstrip("/")})


@login_required
def composed_dashboards_create():
    """Create a new composed dashboard."""
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    dashboard = ComposedDashboard(
        name=name,
        description=data.get("description", ""),
        admin_user_id=current_user.id,
    )
    db.session.add(dashboard)
    db.session.commit()
    return jsonify(dashboard.to_dict()), 201


@login_required
def composed_dashboards_list():
    """List all composed dashboards, paginated, with optional search."""
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 25))
    search_term = request.args.get("q", "").strip()

    query = ComposedDashboard.query

    if search_term:
        query = query.filter(ComposedDashboard.name.ilike(f"%{search_term}%"))

    order = request.args.get("order", "-created_at")
    if order.startswith("-"):
        field = order[1:]
        query = query.order_by(getattr(ComposedDashboard, field, ComposedDashboard.created_at).desc())
    else:
        query = query.order_by(getattr(ComposedDashboard, order, ComposedDashboard.created_at).asc())

    total_count = query.count()
    dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    return jsonify(
        {
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": [d.to_dict() for d in dashboards],
        }
    )
