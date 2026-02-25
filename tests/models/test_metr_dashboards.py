from redash.models import MetrDashboard, db
from tests import BaseTestCase


class MetrDashboardTest(BaseTestCase):
    """Test MetrDashboard model constraints and relationships."""

    def test_creates_metr_dashboard_with_url_identifier(self):
        """Basic creation with url_identifier."""
        dashboard = self.factory.create_dashboard()
        db.session.flush()

        metr_dashboard = MetrDashboard(
            dashboard_id=dashboard.id,
            org_id=dashboard.org_id,
            url_identifier="custom-slug",
        )
        db.session.add(metr_dashboard)
        db.session.flush()

        self.assertEqual(metr_dashboard.dashboard_id, dashboard.id)
        self.assertEqual(metr_dashboard.url_identifier, "custom-slug")

    def test_creates_metr_dashboard_without_url_identifier(self):
        """Creation without url_identifier (NULL is allowed)."""
        dashboard = self.factory.create_dashboard()
        db.session.flush()

        metr_dashboard = MetrDashboard(
            dashboard_id=dashboard.id,
            org_id=dashboard.org_id,
            url_identifier=None,
        )
        db.session.add(metr_dashboard)
        db.session.flush()

        self.assertIsNone(metr_dashboard.url_identifier)

    def test_allows_multiple_null_url_identifiers_in_same_org(self):
        """Multiple dashboards in same org can have NULL url_identifier."""
        dashboard1 = self.factory.create_dashboard()
        dashboard2 = self.factory.create_dashboard(user=dashboard1.user)
        db.session.flush()

        metr1 = MetrDashboard(
            dashboard_id=dashboard1.id,
            org_id=dashboard1.org_id,
            url_identifier=None,
        )
        metr2 = MetrDashboard(
            dashboard_id=dashboard2.id,
            org_id=dashboard2.org_id,
            url_identifier=None,
        )
        db.session.add_all([metr1, metr2])
        db.session.flush()

        # Should succeed - multiple NULLs are allowed
        self.assertIsNone(metr1.url_identifier)
        self.assertIsNone(metr2.url_identifier)

    def test_prevents_duplicate_url_identifier_in_same_org(self):
        """Duplicate url_identifier in same org raises IntegrityError."""
        from sqlalchemy.exc import IntegrityError

        dashboard1 = self.factory.create_dashboard()
        dashboard2 = self.factory.create_dashboard(user=dashboard1.user)
        db.session.flush()

        metr1 = MetrDashboard(
            dashboard_id=dashboard1.id,
            org_id=dashboard1.org_id,
            url_identifier="custom-slug",
        )
        db.session.add(metr1)
        db.session.flush()

        metr2 = MetrDashboard(
            dashboard_id=dashboard2.id,
            org_id=dashboard2.org_id,
            url_identifier="custom-slug",  # Same identifier, same org
        )
        db.session.add(metr2)

        with self.assertRaises(IntegrityError):
            db.session.flush()

    def test_allows_same_url_identifier_in_different_orgs(self):
        """Same url_identifier allowed across different orgs."""
        org1 = self.factory.create_org()
        org2 = self.factory.create_org()

        user1 = self.factory.create_user(org=org1)
        user2 = self.factory.create_user(org=org2)

        dashboard1 = self.factory.create_dashboard(user=user1)
        dashboard2 = self.factory.create_dashboard(user=user2)
        db.session.flush()

        metr1 = MetrDashboard(
            dashboard_id=dashboard1.id,
            org_id=org1.id,
            url_identifier="same-slug",
        )
        metr2 = MetrDashboard(
            dashboard_id=dashboard2.id,
            org_id=org2.id,
            url_identifier="same-slug",  # Same identifier, different org
        )
        db.session.add_all([metr1, metr2])
        db.session.flush()

        # Should succeed - different orgs
        self.assertEqual(metr1.url_identifier, "same-slug")
        self.assertEqual(metr2.url_identifier, "same-slug")

    def test_one_to_one_relationship_with_dashboard(self):
        """MetrDashboard has one-to-one relationship with Dashboard."""
        dashboard = self.factory.create_dashboard()
        db.session.flush()

        metr_dashboard = MetrDashboard(
            dashboard_id=dashboard.id,
            org_id=dashboard.org_id,
            url_identifier="test",
        )
        db.session.add(metr_dashboard)
        db.session.flush()

        # Forward relationship
        self.assertEqual(metr_dashboard.dashboard, dashboard)
        # Backward relationship (uselist=False makes it singular, not a list)
        self.assertEqual(dashboard.metr_dashboard, metr_dashboard)

    def test_prevents_duplicate_dashboard_id(self):
        """Only one MetrDashboard per Dashboard (unique constraint)."""
        from sqlalchemy.exc import IntegrityError

        dashboard = self.factory.create_dashboard()
        db.session.flush()

        metr1 = MetrDashboard(
            dashboard_id=dashboard.id,
            org_id=dashboard.org_id,
            url_identifier="first",
        )
        db.session.add(metr1)
        db.session.flush()

        metr2 = MetrDashboard(
            dashboard_id=dashboard.id,  # Same dashboard_id
            org_id=dashboard.org_id,
            url_identifier="second",
        )
        db.session.add(metr2)

        with self.assertRaises(IntegrityError):
            db.session.flush()

    def test_cascade_delete_when_dashboard_deleted(self):
        """MetrDashboard is deleted when Dashboard is deleted (CASCADE)."""
        dashboard = self.factory.create_dashboard()
        db.session.flush()

        metr_dashboard = MetrDashboard(
            dashboard_id=dashboard.id,
            org_id=dashboard.org_id,
            url_identifier="test",
        )
        db.session.add(metr_dashboard)
        db.session.flush()

        metr_id = metr_dashboard.id

        # Delete the dashboard
        db.session.delete(dashboard)
        db.session.flush()

        # MetrDashboard should be gone
        deleted_metr = MetrDashboard.query.get(metr_id)
        self.assertIsNone(deleted_metr)
