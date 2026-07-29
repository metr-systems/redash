from redash.models import db
from tests.test_global_auth import GlobalBaseTestCase


class SubDashboardsReadApiTest(GlobalBaseTestCase):
    def setUp(self):
        super().setUp()
        self._create_admin("admin", "secret")
        self.global_client.post("/login", data={"username": "admin", "password": "secret"})

    def _create_template_org(self):
        return self.factory.create_org(slug="se_template", name="Template")

    def _create_sub_dashboard(self, org, name="Template A", is_draft=False, is_archived=False):
        return self.factory.create_dashboard(org=org, name=name, is_draft=is_draft, is_archived=is_archived)

    def test_requires_authentication(self):
        anonymous = self.global_app.test_client()
        response = anonymous.get("/global-api/sub-dashboards")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.headers["Location"])

    def test_list_returns_only_template_org_dashboards(self):
        template_org = self._create_template_org()
        self._create_sub_dashboard(template_org, name="In Template")
        self.factory.create_dashboard(org=self.factory.org, name="In Client Org")
        db.session.commit()

        data = self.global_client.get("/global-api/sub-dashboards").get_json()

        self.assertEqual(data["count"], 1)
        self.assertEqual([d["name"] for d in data["results"]], ["In Template"])

    def test_list_excludes_drafts_and_archived(self):
        template_org = self._create_template_org()
        self._create_sub_dashboard(template_org, name="Published")
        self._create_sub_dashboard(template_org, name="Draft", is_draft=True)
        self._create_sub_dashboard(template_org, name="Archived", is_archived=True)
        db.session.commit()

        data = self.global_client.get("/global-api/sub-dashboards").get_json()

        self.assertEqual([d["name"] for d in data["results"]], ["Published"])

    def test_list_orders_newest_first(self):
        import datetime

        template_org = self._create_template_org()
        older = self._create_sub_dashboard(template_org, name="Older")
        newer = self._create_sub_dashboard(template_org, name="Newer")
        older.created_at = datetime.datetime(2020, 1, 1)
        newer.created_at = datetime.datetime(2021, 1, 1)
        db.session.commit()

        data = self.global_client.get("/global-api/sub-dashboards").get_json()

        self.assertEqual([d["name"] for d in data["results"]], ["Newer", "Older"])

    def test_list_paginates(self):
        template_org = self._create_template_org()
        for i in range(3):
            self._create_sub_dashboard(template_org, name="D{}".format(i))
        db.session.commit()

        data = self.global_client.get("/global-api/sub-dashboards?page=1&page_size=2").get_json()

        self.assertEqual(data["count"], 3)
        self.assertEqual(len(data["results"]), 2)

    def test_result_includes_link_out_url(self):
        template_org = self._create_template_org()
        dashboard = self._create_sub_dashboard(template_org, name="Linkable")
        db.session.commit()

        data = self.global_client.get("/global-api/sub-dashboards").get_json()

        self.assertTrue(
            data["results"][0]["url"].endswith("/se_template/dashboards/{}-{}".format(dashboard.id, dashboard.slug))
        )
