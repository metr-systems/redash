from redash.models import db
from tests.test_global_auth import GlobalBaseTestCase


class OrganizationsReadApiTest(GlobalBaseTestCase):
    def setUp(self):
        super().setUp()
        self._create_admin("admin", "secret")
        self.global_client.post("/login", data={"username": "admin", "password": "secret"})

    def test_requires_authentication(self):
        anonymous = self.global_app.test_client()
        response = anonymous.get("/global-api/organizations")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.headers["Location"])

    def test_lists_organizations_ordered_by_name(self):
        self.factory.create_org(slug="beta", name="Beta")
        self.factory.create_org(slug="alpha", name="Alpha")
        db.session.commit()

        results = self.global_client.get("/global-api/organizations").get_json()

        names = [o["name"] for o in results]
        self.assertEqual(names, sorted(names))
        self.assertIn("Alpha", names)
        self.assertIn("Beta", names)

    def test_result_shape(self):
        org = self.factory.create_org(slug="acme", name="Acme")
        db.session.commit()

        results = self.global_client.get("/global-api/organizations").get_json()

        acme = next(o for o in results if o["slug"] == "acme")
        self.assertEqual(acme, {"id": org.id, "name": "Acme", "slug": "acme"})
