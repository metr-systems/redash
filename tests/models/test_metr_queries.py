from sqlalchemy.exc import IntegrityError

from redash.models import MetrQuery, db
from tests import BaseTestCase


class MetrQueryTest(BaseTestCase):
    """Test MetrQuery model constraints and relationships."""

    def test_prevents_duplicate_query_identifier_in_same_org(self):
        """Duplicate query_identifier in same org raises IntegrityError."""
        query1 = self.factory.create_query()
        query2 = self.factory.create_query()
        db.session.flush()

        metr1 = MetrQuery(
            query_id=query1.id,
            org_id=query1.org_id,
            query_identifier="shared-slug",
        )
        db.session.add(metr1)
        db.session.flush()

        metr2 = MetrQuery(
            query_id=query2.id,
            org_id=query2.org_id,
            query_identifier="shared-slug",  # Same identifier, same org
        )
        db.session.add(metr2)

        with self.assertRaises(IntegrityError):
            db.session.flush()

    def test_allows_same_query_identifier_in_different_orgs(self):
        """Same query_identifier allowed across different orgs."""
        org1 = self.factory.create_org()
        org2 = self.factory.create_org()

        query1 = self.factory.create_query(org=org1)
        query2 = self.factory.create_query(org=org2)
        db.session.flush()

        metr1 = MetrQuery(
            query_id=query1.id,
            org_id=org1.id,
            query_identifier="same-slug",
        )
        metr2 = MetrQuery(
            query_id=query2.id,
            org_id=org2.id,
            query_identifier="same-slug",  # Same identifier, different org
        )
        db.session.add_all([metr1, metr2])
        db.session.flush()

        self.assertEqual(metr1.query_identifier, "same-slug")
        self.assertEqual(metr2.query_identifier, "same-slug")
