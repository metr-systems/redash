import pytest

from redash.models import db
from redash_global.models import SubDashboardAssignment

MISSING_DASHBOARD_URL = "/global-api/sub-dashboards/999999/assignments"


@pytest.fixture
def dashboard(factory):
    dashboard = factory.create_dashboard(name="Template A")
    db.session.commit()
    return dashboard


@pytest.fixture
def url(dashboard):
    return "/global-api/sub-dashboards/{}/assignments".format(dashboard.id)


@pytest.fixture
def assign(dashboard):
    def create(org):
        assignment = SubDashboardAssignment(dashboard_id=dashboard.id, organization_id=org.id)
        db.session.add(assignment)
        db.session.commit()
        return assignment

    return create


def test_requires_authentication(client, url):
    response = client.get(url)

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_list_embeds_dashboard_and_orders_by_org_name(admin_client, factory, url, assign):
    assign(factory.create_org(slug="beta", name="Beta"))
    assign(factory.create_org(slug="alpha", name="Alpha"))

    data = admin_client.get(url).get_json()

    assert data["dashboard"]["name"] == "Template A"
    assert [a["organization_name"] for a in data["assignments"]] == ["Alpha", "Beta"]


def test_create_assigns_and_returns_row(admin_client, factory, dashboard, url):
    response = admin_client.post(url, json={"organization_id": factory.org.id})

    assert response.status_code == 201
    body = response.get_json()
    assert body["organization_id"] == factory.org.id
    assert SubDashboardAssignment.query.get(body["id"]).dashboard_id == dashboard.id


def test_list_missing_dashboard_returns_404(admin_client):
    response = admin_client.get(MISSING_DASHBOARD_URL)

    assert response.status_code == 404


def test_create_missing_dashboard_returns_404(admin_client, factory):
    response = admin_client.post(MISSING_DASHBOARD_URL, json={"organization_id": factory.org.id})

    assert response.status_code == 404


def test_create_duplicate_returns_conflict(admin_client, factory, url, assign):
    assign(factory.org)

    response = admin_client.post(url, json={"organization_id": factory.org.id})

    assert response.status_code == 409


def test_delete_removes_assignment(admin_client, factory, url, assign):
    assignment = assign(factory.org)

    response = admin_client.delete("{}/{}".format(url, assignment.id))

    assert response.status_code == 204
    assert SubDashboardAssignment.query.get(assignment.id) is None
