def test_requires_authentication(client):
    response = client.get("/global-api/organizations")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_lists_organizations_ordered_by_name(admin_client, factory):
    factory.create_org(slug="beta", name="Beta")
    factory.create_org(slug="alpha", name="Alpha")

    results = admin_client.get("/global-api/organizations").get_json()

    names = [org["name"] for org in results]
    assert names == sorted(names)
    assert "Alpha" in names
    assert "Beta" in names


def test_result_shape(admin_client, factory):
    org = factory.create_org(slug="acme", name="Acme")

    results = admin_client.get("/global-api/organizations").get_json()

    acme = next(o for o in results if o["slug"] == "acme")
    assert acme == {"id": org.id, "name": "Acme", "slug": "acme"}
