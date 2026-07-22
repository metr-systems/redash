from flask import jsonify, request
from flask_login import login_required

from redash import models
from redash.models import db
from redash_global.models import SubDashboardAssignment


def _serialize_dashboard(dashboard):
    metr_dashboard = dashboard.metr_dashboard
    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slug": dashboard.slug,
        "url_identifier": metr_dashboard.url_identifier if metr_dashboard else None,
    }


def _serialize_assignment(assignment, org):
    return {
        "id": assignment.id,
        "organization_id": assignment.organization_id,
        "organization_name": org.name,
        "organization_slug": org.slug,
    }


@login_required
def assignments_list(dashboard_id):
    dashboard = models.Dashboard.query.get(dashboard_id)

    rows = (
        db.session.query(SubDashboardAssignment, models.Organization)
        .join(models.Organization, SubDashboardAssignment.organization_id == models.Organization.id)
        .filter(SubDashboardAssignment.dashboard_id == dashboard_id)
        .order_by(models.Organization.name)
        .all()
    )

    return jsonify(
        {
            "dashboard": _serialize_dashboard(dashboard),
            "assignments": [_serialize_assignment(assignment, org) for assignment, org in rows],
        }
    )


@login_required
def assignment_create(dashboard_id):
    body = request.get_json(silent=True) or {}
    organization_id = body.get("organization_id")

    assignment = SubDashboardAssignment(dashboard_id=dashboard_id, organization_id=organization_id)
    db.session.add(assignment)
    db.session.commit()

    org = models.Organization.query.get(organization_id)
    return jsonify(_serialize_assignment(assignment, org)), 201


@login_required
def assignment_delete(dashboard_id, assignment_id):
    SubDashboardAssignment.query.filter_by(id=assignment_id, dashboard_id=dashboard_id).delete()
    db.session.commit()
    return "", 204
