import datetime

import pytest

from redash_global import settings

URL = "/global-api/sub-dashboards"


@pytest.fixture
def template_org(factory):
    return factory.create_org(slug=settings.TEMPLATE_ORG_SLUG, name="Template")


@pytest.fixture
def create_sub_dashboard(factory, template_org):
    def create(name="Template A", **kwargs):
        return factory.create_dashboard(org=template_org, name=name, **kwargs)

    return create


def test_requires_authentication(client):
    response = client.get(URL)

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_list_returns_only_template_org_dashboards(admin_client, factory, create_sub_dashboard):
    create_sub_dashboard(name="In Template")
    factory.create_dashboard(org=factory.org, name="In Client Org")

    data = admin_client.get(URL).get_json()

    assert data["count"] == 1
    assert [d["name"] for d in data["results"]] == ["In Template"]


def test_list_excludes_drafts_and_archived(admin_client, create_sub_dashboard):
    create_sub_dashboard(name="Published")
    create_sub_dashboard(name="Draft", is_draft=True)
    create_sub_dashboard(name="Archived", is_archived=True)

    data = admin_client.get(URL).get_json()

    assert [d["name"] for d in data["results"]] == ["Published"]


def test_list_orders_newest_first(admin_client, create_sub_dashboard):
    create_sub_dashboard(name="Older", created_at=datetime.datetime(2020, 1, 1))
    create_sub_dashboard(name="Newer", created_at=datetime.datetime(2021, 1, 1))

    data = admin_client.get(URL).get_json()

    assert [d["name"] for d in data["results"]] == ["Newer", "Older"]


def test_list_paginates(admin_client, create_sub_dashboard):
    for i in range(3):
        create_sub_dashboard(name=f"D{i}")

    data = admin_client.get(f"{URL}?page=1&page_size=2").get_json()

    assert data["count"] == 3
    assert len(data["results"]) == 2


def test_result_includes_link_out_url(admin_client, create_sub_dashboard):
    dashboard = create_sub_dashboard(name="Linkable")

    data = admin_client.get(URL).get_json()

    assert data["results"][0]["url"].endswith(
        f"/{settings.TEMPLATE_ORG_SLUG}/dashboards/{dashboard.id}-{dashboard.slug}"
    )
