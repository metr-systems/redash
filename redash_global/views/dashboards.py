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
def template_dashboards_list():
    """List dashboards from the _template organization, paginated, with optional search."""
    from redash import models

    TEMPLATE_ORG_SLUG = "_template"
    org = models.Organization.get_by_slug(TEMPLATE_ORG_SLUG)
    if not org:
        return jsonify({"count": 0, "page": 1, "page_size": 25, "results": []}), 200

    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 25))
    search_term = request.args.get("q", "").strip()

    redash_url = os.environ.get("REDASH_URL", "").rstrip("/")

    query = models.Dashboard.query.filter(
        models.Dashboard.org == org,
        models.Dashboard.is_archived.is_(False),
        models.Dashboard.is_draft.is_(False),
    )

    if search_term:
        query = query.filter(models.Dashboard.name.ilike(f"%{search_term}%"))

    order = request.args.get("order", "-created_at")
    if order.startswith("-"):
        field = order[1:]
        query = query.order_by(getattr(models.Dashboard, field, models.Dashboard.created_at).desc())
    else:
        query = query.order_by(getattr(models.Dashboard, order, models.Dashboard.created_at).asc())

    total_count = query.count()
    dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for d in dashboards:
        d_dict = d.to_dict()
        d_dict["url"] = f"{redash_url}/_template/dashboard/{d.slug}"
        results.append(d_dict)

    return jsonify(
        {
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": results,
        }
    )


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
