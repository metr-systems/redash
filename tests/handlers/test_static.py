from redash.models import MetrDashboard, db
from tests import BaseTestCase


class TestDashboardByUrlIdentifier(BaseTestCase):
    def test_successful_redirect(self):
        dashboard = self.factory.create_dashboard()

        # Create a user for authentication
        test_user = self.factory.create_user()

        metr_dashboard = MetrDashboard(dashboard_id=dashboard.id, org_id=dashboard.org_id, url_identifier="test-id")
        db.session.add(metr_dashboard)
        db.session.commit()

        rv = self.make_request("get", "/dashboards/by_url_identifier/test-id", user=test_user, is_json=False)

        self.assertEqual(rv.status_code, 302)
        expected_path = f"/{self.factory.org.slug}/dashboards/{dashboard.id}-{dashboard.slug}"
        self.assertEqual(rv.location, expected_path)

    def test_redirect_preserves_query_params(self):
        dashboard = self.factory.create_dashboard()
        test_user = self.factory.create_user()

        metr_dashboard = MetrDashboard(dashboard_id=dashboard.id, org_id=dashboard.org_id, url_identifier="test-id")
        db.session.add(metr_dashboard)
        db.session.commit()

        rv = self.make_request(
            "get",
            "/dashboards/by_url_identifier/test-id?p_Liegenschaft=00000000-0000-0000-0000-000000000000",
            user=test_user,
            is_json=False,
        )

        self.assertEqual(rv.status_code, 302)
        expected_path = (
            f"/{self.factory.org.slug}/dashboards/{dashboard.id}-{dashboard.slug}"
            "?p_Liegenschaft=00000000-0000-0000-0000-000000000000"
        )
        self.assertEqual(rv.location, expected_path)

    def test_not_found(self):
        # Create a user for authentication
        test_user = self.factory.create_user()

        rv = self.make_request("get", "/dashboards/by_url_identifier/nonexistent", user=test_user, is_json=False)

        self.assertEqual(rv.status_code, 404)
