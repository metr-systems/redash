from redash.models import DataSource, MetrDataSource, db
from tests import BaseTestCase


class TestMetrDataSourceIdentifierValidationResource(BaseTestCase):
    def setUp(self):
        super(TestMetrDataSourceIdentifierValidationResource, self).setUp()
        self.admin = self.factory.create_admin()

    def path(self, data_source):
        return f"/api/data_sources/{data_source.id}/data_source_identifier/validate"

    def test_validate_valid_data_source_identifier(self):
        """Test that a valid data source identifier passes validation."""
        data_source = self.factory.create_data_source()

        rv = self.make_request(
            "post",
            self.path(data_source),
            data={"data_source_identifier": "remote-monitoring"},
            user=self.admin,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(rv.json["valid"])
        self.assertEqual(rv.json["errors"], [])

    def test_validate_empty_data_source_identifier(self):
        """Test that an empty data source identifier fails validation."""
        data_source = self.factory.create_data_source()

        rv = self.make_request(
            "post",
            self.path(data_source),
            data={"data_source_identifier": ""},
            user=self.admin,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Data source identifier is required", rv.json["errors"])

    def test_validate_invalid_slug(self):
        """Test that invalid slug format fails validation."""
        data_source = self.factory.create_data_source()

        rv = self.make_request(
            "post",
            self.path(data_source),
            data={"data_source_identifier": "Invalid Slug!"},
            user=self.admin,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Not a valid slug", rv.json["errors"])

    def test_validate_duplicate_data_source_identifier(self):
        """Test that duplicate data source identifier fails validation."""
        data_source1 = self.factory.create_data_source()
        data_source2 = self.factory.create_data_source()

        db.session.add(
            MetrDataSource(
                data_source_id=data_source1.id,
                org_id=data_source1.org_id,
                data_source_identifier="existing-id",
            )
        )
        db.session.commit()

        rv = self.make_request(
            "post",
            self.path(data_source2),
            data={"data_source_identifier": "existing-id"},
            user=self.admin,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.json["valid"])
        self.assertIn("Already used data source identifier", rv.json["errors"][0])

    def test_validate_own_identifier_is_not_a_duplicate(self):
        """Re-submitting a data source's own identifier is valid."""
        data_source = self.factory.create_data_source()
        db.session.add(
            MetrDataSource(
                data_source_id=data_source.id,
                org_id=data_source.org_id,
                data_source_identifier="mine",
            )
        )
        db.session.commit()

        rv = self.make_request(
            "post",
            self.path(data_source),
            data={"data_source_identifier": "mine"},
            user=self.admin,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(rv.json["valid"])

    def test_validate_same_identifier_in_another_org(self):
        """An identifier used in a different org does not collide."""
        other_org = self.factory.create_org()
        other_data_source = self.factory.create_data_source(org=other_org)
        db.session.add(
            MetrDataSource(
                data_source_id=other_data_source.id,
                org_id=other_org.id,
                data_source_identifier="remote-monitoring",
            )
        )
        db.session.commit()

        data_source = self.factory.create_data_source()
        rv = self.make_request(
            "post",
            self.path(data_source),
            data={"data_source_identifier": "remote-monitoring"},
            user=self.admin,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(rv.json["valid"])

    def test_validate_requires_admin(self):
        """A non-admin cannot stamp identifiers, so it cannot validate them either."""
        data_source = self.factory.create_data_source()

        rv = self.make_request(
            "post",
            self.path(data_source),
            data={"data_source_identifier": "remote-monitoring"},
            user=self.factory.create_user(),
        )

        self.assertEqual(rv.status_code, 403)


class TestDataSourceIdentifierPersistence(BaseTestCase):
    """The identifier is written through DataSourceResource.post."""

    def setUp(self):
        super(TestDataSourceIdentifierPersistence, self).setUp()
        self.admin = self.factory.create_admin()
        self.data_source = self.factory.data_source
        self.path = f"/api/data_sources/{self.data_source.id}"

    def post(self, **extra):
        data = {
            "name": self.data_source.name,
            "type": "pg",
            "options": {"dbname": "testdb"},
        }
        data.update(extra)
        return self.make_request("post", self.path, data=data, user=self.admin)

    def test_creates_the_sidecar_on_first_write(self):
        rv = self.post(data_source_identifier="remote-monitoring")

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["data_source_identifier"], "remote-monitoring")

        data_source = DataSource.query.get(self.data_source.id)
        self.assertEqual(data_source.metr_data_source.data_source_identifier, "remote-monitoring")
        self.assertEqual(data_source.metr_data_source.org_id, data_source.org_id)

    def test_updates_an_existing_sidecar(self):
        db.session.add(
            MetrDataSource(
                data_source=self.data_source,
                org_id=self.data_source.org_id,
                data_source_identifier="old-id",
            )
        )
        db.session.commit()

        rv = self.post(data_source_identifier="new-id")

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["data_source_identifier"], "new-id")
        self.assertEqual(MetrDataSource.query.count(), 1)

    def test_empty_identifier_is_stored_as_null(self):
        """So the partial unique index does not treat "" as a used identifier."""
        rv = self.post(data_source_identifier="")

        self.assertEqual(rv.status_code, 200)
        self.assertIsNone(rv.json["data_source_identifier"])

        data_source = DataSource.query.get(self.data_source.id)
        self.assertIsNone(data_source.metr_data_source.data_source_identifier)

    def test_omitting_the_field_leaves_the_identifier_alone(self):
        db.session.add(
            MetrDataSource(
                data_source=self.data_source,
                org_id=self.data_source.org_id,
                data_source_identifier="untouched",
            )
        )
        db.session.commit()

        rv = self.post(name="Renamed")

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["data_source_identifier"], "untouched")


class TestDataSourceSerialization(BaseTestCase):
    def test_identifier_is_serialized_for_non_admins(self):
        """The field is unconditional, not behind all=True: the frontend needs it."""
        data_source = self.factory.data_source
        db.session.add(
            MetrDataSource(
                data_source=data_source,
                org_id=data_source.org_id,
                data_source_identifier="remote-monitoring",
            )
        )
        db.session.commit()

        rv = self.make_request(
            "get",
            f"/api/data_sources/{data_source.id}",
            user=self.factory.create_user(),
        )

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["data_source_identifier"], "remote-monitoring")

    def test_identifier_is_null_without_a_sidecar(self):
        rv = self.make_request(
            "get",
            f"/api/data_sources/{self.factory.data_source.id}",
            user=self.factory.create_admin(),
        )

        self.assertEqual(rv.status_code, 200)
        self.assertIsNone(rv.json["data_source_identifier"])
