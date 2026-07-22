import os

from flask import jsonify, request
from flask_login import login_required

from redash import models

TEMPLATE_ORG_SLUG = os.environ.get("TEMPLATE_ORG_SLUG", "se_template")


def _main_redash_url():
    return os.environ.get("REDASH_URL", "").rstrip("/")


def _serialize(dashboard, redash_url):
    metr_dashboard = dashboard.metr_dashboard
    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slug": dashboard.slug,
        "url_identifier": metr_dashboard.url_identifier if metr_dashboard else None,
        "created_at": dashboard.created_at.isoformat() if dashboard.created_at else None,
        "url": f"{redash_url}/{TEMPLATE_ORG_SLUG}/dashboard/{dashboard.slug}",
    }


@login_required
def template_dashboards_list():
    """List published, non-archived template dashboards in the _template org,
    newest first, paginated."""
    org = models.Organization.get_by_slug(TEMPLATE_ORG_SLUG)
    if org is None:
        # prevent erroring page in case the template org does not exist
        return jsonify({"count": 0, "page": 1, "page_size": 25, "results": []})

    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 25))

    query = models.Dashboard.query.filter(
        models.Dashboard.org == org,
        models.Dashboard.is_archived.is_(False),
        models.Dashboard.is_draft.is_(False),
    ).order_by(models.Dashboard.created_at.desc())

    total = query.count()
    dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    redash_url = _main_redash_url()
    return jsonify(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": [_serialize(d, redash_url) for d in dashboards],
        }
    )
