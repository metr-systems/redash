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

    def test_prevents_two_queries_in_same_org_pointing_at_one_template(self):
        template = self.factory.create_query()
        query1 = self.factory.create_query()
        query2 = self.factory.create_query()
        db.session.flush()

        metr1 = MetrQuery(query_id=query1.id, org_id=query1.org_id, template_query_id=template.id)
        db.session.add(metr1)
        db.session.flush()

        metr2 = MetrQuery(query_id=query2.id, org_id=query2.org_id, template_query_id=template.id)
        db.session.add(metr2)

        with self.assertRaises(IntegrityError):
            db.session.flush()

    def test_allows_multiple_null_template_query_ids_in_same_org(self):
        query1 = self.factory.create_query()
        query2 = self.factory.create_query()
        db.session.flush()

        metr1 = MetrQuery(query_id=query1.id, org_id=query1.org_id)
        metr2 = MetrQuery(query_id=query2.id, org_id=query2.org_id)
        db.session.add_all([metr1, metr2])
        db.session.flush()

        self.assertIsNone(metr1.template_query_id)
        self.assertIsNone(metr2.template_query_id)

    def test_allows_same_template_query_id_in_different_orgs(self):
        org1 = self.factory.create_org()
        org2 = self.factory.create_org()

        template = self.factory.create_query()
        query1 = self.factory.create_query(org=org1)
        query2 = self.factory.create_query(org=org2)
        db.session.flush()

        metr1 = MetrQuery(query_id=query1.id, org_id=org1.id, template_query_id=template.id)
        metr2 = MetrQuery(query_id=query2.id, org_id=org2.id, template_query_id=template.id)
        db.session.add_all([metr1, metr2])
        db.session.flush()

        self.assertEqual(metr1.template_query_id, template.id)
        self.assertEqual(metr2.template_query_id, template.id)

    def test_deleting_the_template_query_clears_the_reference(self):
        template = self.factory.create_query()
        query = self.factory.create_query()
        metr = MetrQuery(query_id=query.id, org_id=query.org_id, template_query_id=template.id)
        db.session.add(metr)
        db.session.commit()

        db.session.delete(template)
        db.session.commit()
        db.session.refresh(metr)

        self.assertIsNone(metr.template_query_id)
        self.assertEqual(metr.query_id, query.id)

    def test_query_relationship_resolves_to_the_deployed_query(self):
        template = self.factory.create_query()
        query = self.factory.create_query()
        metr = MetrQuery(query=query, org_id=query.org_id, template_query_id=template.id)
        db.session.add(metr)
        db.session.commit()

        self.assertEqual(metr.query, query)
        self.assertEqual(query.metr_query, metr)
        self.assertIsNone(template.metr_query)
