import os

from flask import jsonify, request
from flask_login import login_required

from redash import models
from redash.utils import base_url

TEMPLATE_ORG_SLUG = os.environ.get("TEMPLATE_ORG_SLUG", "se_template")


def _serialize(dashboard, org_base_url):
    metr_dashboard = dashboard.metr_dashboard
    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slug": dashboard.slug,
        "url_identifier": metr_dashboard.url_identifier if metr_dashboard else None,
        "url": f"{org_base_url}/dashboards/{dashboard.id}-{dashboard.slug}",
    }


@login_required
def sub_dashboards_list():
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

    org_base_url = base_url(org)
    return jsonify(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": [_serialize(d, org_base_url) for d in dashboards],
        }
    )
