import datetime

import pytest

from redash_global.models import ComposedDashboard

LIST_URL = "/global-api/composed-dashboards"


@pytest.fixture
def composed_dashboard(factory):
    return factory.create_composed_dashboard(name="Dashboard A", url_identifier="dashboard-a")


@pytest.fixture
def detail_url(composed_dashboard):
    return f"{LIST_URL}/{composed_dashboard.id}"


def test_list_requires_authentication(client):
    response = client.get(LIST_URL)

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_list_returns_all_composed_dashboards(admin_client, factory):
    factory.create_composed_dashboard(name="First", url_identifier="first")
    factory.create_composed_dashboard(name="Second", url_identifier="second")

    data = admin_client.get(LIST_URL).get_json()

    assert data["count"] == 2
    assert len(data["results"]) == 2
    names = [d["name"] for d in data["results"]]
    assert "First" in names
    assert "Second" in names


def test_list_orders_newest_first(admin_client, factory):
    factory.create_composed_dashboard(name="Older", url_identifier="older", created_at=datetime.datetime(2020, 1, 1))
    factory.create_composed_dashboard(name="Newer", url_identifier="newer", created_at=datetime.datetime(2021, 1, 1))

    data = admin_client.get(LIST_URL).get_json()

    assert [d["name"] for d in data["results"]] == ["Newer", "Older"]


def test_list_paginates(admin_client, factory):
    for i in range(3):
        factory.create_composed_dashboard(name=f"Dashboard {i}", url_identifier=f"dashboard-{i}")

    data = admin_client.get(f"{LIST_URL}?page=1&page_size=2").get_json()

    assert data["count"] == 3
    assert len(data["results"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2


def test_list_returns_expected_fields(admin_client, factory):
    dashboard = factory.create_composed_dashboard(name="Test Dashboard", url_identifier="test-dashboard")

    data = admin_client.get(LIST_URL).get_json()
    result = data["results"][0]

    assert result["id"] == dashboard.id
    assert result["name"] == "Test Dashboard"
    assert result["url_identifier"] == "test-dashboard"
    assert "created_at" in result
    assert "updated_at" in result


def test_detail_requires_authentication(client, composed_dashboard):
    response = client.get(f"{LIST_URL}/{composed_dashboard.id}")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_detail_returns_composed_dashboard(admin_client, composed_dashboard):
    response = admin_client.get(f"{LIST_URL}/{composed_dashboard.id}")

    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == composed_dashboard.id
    assert data["name"] == "Dashboard A"
    assert data["url_identifier"] == "dashboard-a"


def test_detail_returns_404_for_missing_dashboard(admin_client):
    response = admin_client.get(f"{LIST_URL}/999999")

    assert response.status_code == 404


def test_create_requires_authentication(client):
    response = client.post(LIST_URL, json={"name": "Test", "url_identifier": "test"})

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_create_creates_and_returns_composed_dashboard(admin_client):
    response = admin_client.post(LIST_URL, json={"name": "New Dashboard", "url_identifier": "new-dashboard"})

    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "New Dashboard"
    assert data["url_identifier"] == "new-dashboard"
    assert "id" in data
    assert "created_at" in data

    dashboard = ComposedDashboard.query.get(data["id"])
    assert dashboard is not None
    assert dashboard.name == "New Dashboard"
    assert dashboard.url_identifier == "new-dashboard"


def test_create_with_duplicate_url_identifier_fails(admin_client, composed_dashboard):
    response = admin_client.post(
        LIST_URL,
        json={"name": "Another Dashboard", "url_identifier": composed_dashboard.url_identifier},
    )

    assert response.status_code >= 400


def test_delete_requires_authentication(client, composed_dashboard):
    response = client.delete(f"{LIST_URL}/{composed_dashboard.id}")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_delete_removes_composed_dashboard(admin_client, composed_dashboard):
    dashboard_id = composed_dashboard.id

    response = admin_client.delete(f"{LIST_URL}/{dashboard_id}")

    assert response.status_code == 204
    assert ComposedDashboard.query.get(dashboard_id) is None


def test_delete_returns_404_for_missing_dashboard(admin_client):
    response = admin_client.delete(f"{LIST_URL}/999999")

    assert response.status_code == 404
