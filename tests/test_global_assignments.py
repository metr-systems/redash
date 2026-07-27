from redash.models import db
from redash_global.models import SubDashboardAssignment
from tests.test_global_auth import GlobalBaseTestCase


class SubDashboardAssignmentApiTest(GlobalBaseTestCase):
    def setUp(self):
        super().setUp()
        self._create_admin("admin", "secret")
        self.global_client.post("/login", data={"username": "admin", "password": "secret"})
        self.dashboard = self.factory.create_dashboard(name="Template A")
        self.org = self.factory.org
        db.session.commit()

    def _url(self, suffix=""):
        return "/global-api/sub-dashboards/{}/assignments{}".format(self.dashboard.id, suffix)

    def _assign(self, org):
        assignment = SubDashboardAssignment(dashboard_id=self.dashboard.id, organization_id=org.id)
        db.session.add(assignment)
        db.session.commit()
        return assignment

    def test_requires_authentication(self):
        response = self.global_app.test_client().get(self._url())

        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.headers["Location"])

    def test_list_embeds_dashboard_and_orders_by_org_name(self):
        self._assign(self.factory.create_org(slug="beta", name="Beta"))
        self._assign(self.factory.create_org(slug="alpha", name="Alpha"))

        data = self.global_client.get(self._url()).get_json()

        self.assertEqual(data["dashboard"]["name"], "Template A")
        self.assertEqual([a["organization_name"] for a in data["assignments"]], ["Alpha", "Beta"])

    def test_create_assigns_and_returns_row(self):
        response = self.global_client.post(self._url(), json={"organization_id": self.org.id})

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(body["organization_id"], self.org.id)
        self.assertEqual(SubDashboardAssignment.query.get(body["id"]).dashboard_id, self.dashboard.id)

    def test_create_duplicate_returns_conflict(self):
        self._assign(self.org)

        response = self.global_client.post(self._url(), json={"organization_id": self.org.id})

        self.assertEqual(response.status_code, 409)

    def test_delete_removes_assignment(self):
        assignment = self._assign(self.org)

        response = self.global_client.delete(self._url("/{}".format(assignment.id)))

        self.assertEqual(response.status_code, 204)
        self.assertIsNone(SubDashboardAssignment.query.get(assignment.id))
