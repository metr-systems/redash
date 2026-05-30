from redash.models import MetrQuery, db
from tests import BaseTestCase


class TestMetrQueryIdentifierValidationResource(BaseTestCase):
    def test_validate_valid_query_identifier(self):
        """Test that a valid query identifier passes validation."""
        query = self.factory.create_query()

        rv = self.make_request(
            "post",
            f"/api/queries/{query.id}/query_identifier/validate",
            data={"query_identifier": "my-query-id"},
        )

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(rv.json["valid"])
        self.assertEqual(rv.json["errors"], [])

    def test_validate_empty_query_identifier(self):
        """Test that an empty query identifier fails validation."""
        query = self.factory.create_query()

        rv = self.make_request(
            "post", f"/api/queries/{query.id}/query_identifier/validate", data={"query_identifier": ""}
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Query identifier is required", rv.json["errors"])

    def test_validate_invalid_slug(self):
        """Test that invalid slug format fails validation."""
        query = self.factory.create_query()

        rv = self.make_request(
            "post", f"/api/queries/{query.id}/query_identifier/validate", data={"query_identifier": "Invalid Slug!"}
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Not a valid slug", rv.json["errors"])

    def test_validate_duplicate_query_identifier(self):
        """Test that duplicate query identifier fails validation."""
        query1 = self.factory.create_query()
        query2 = self.factory.create_query()

        # Create MetrQuery with query_identifier for first query
        metr_query1 = MetrQuery(query_id=query1.id, org_id=query1.org_id, query_identifier="existing-id")
        db.session.add(metr_query1)
        db.session.commit()

        # Try to validate the same identifier for second query
        rv = self.make_request(
            "post",
            f"/api/queries/{query2.id}/query_identifier/validate",
            data={"query_identifier": "existing-id"},
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Already used query identifier", rv.json["errors"][0])
