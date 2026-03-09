from redash.models import MetrDashboard, db
from tests import BaseTestCase


class TestMetrDashboardUrlIdentifierValidationResource(BaseTestCase):
    def test_validate_valid_url_identifier(self):
        """Test that a valid URL identifier passes validation."""
        dashboard = self.factory.create_dashboard()

        rv = self.make_request(
            "post",
            f"/api/dashboards/{dashboard.id}/url_identifier/validate",
            data={"url_identifier": "my-dashboard-slug"},
        )

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(rv.json["valid"])
        self.assertEqual(rv.json["errors"], [])

    def test_validate_empty_url_identifier(self):
        """Test that an empty URL identifier fails validation."""
        dashboard = self.factory.create_dashboard()

        rv = self.make_request(
            "post", f"/api/dashboards/{dashboard.id}/url_identifier/validate", data={"url_identifier": ""}
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("URL identifier is required", rv.json["errors"])

    def test_validate_invalid_slug(self):
        """Test that invalid slug format fails validation."""
        dashboard = self.factory.create_dashboard()

        rv = self.make_request(
            "post", f"/api/dashboards/{dashboard.id}/url_identifier/validate", data={"url_identifier": "Invalid Slug!"}
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Not a valid slug", rv.json["errors"])

    def test_validate_duplicate_url_identifier(self):
        """Test that duplicate URL identifier fails validation."""
        dashboard1 = self.factory.create_dashboard()
        dashboard2 = self.factory.create_dashboard()

        # Create MetrDashboard with url_identifier for first dashboard
        metr_dashboard1 = MetrDashboard(
            dashboard_id=dashboard1.id, org_id=dashboard1.org_id, url_identifier="existing-slug"
        )
        db.session.add(metr_dashboard1)
        db.session.commit()

        # Try to validate the same identifier for second dashboard
        rv = self.make_request(
            "post",
            f"/api/dashboards/{dashboard2.id}/url_identifier/validate",
            data={"url_identifier": "existing-slug"},
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Already used URL identifier", rv.json["errors"][0])
