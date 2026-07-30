from sqlalchemy.exc import IntegrityError

from redash.models import MetrDataSource, db
from tests import BaseTestCase


class MetrDataSourceTest(BaseTestCase):
    """Test MetrDataSource model constraints and relationships."""

    def test_prevents_duplicate_data_source_identifier_in_same_org(self):
        """Duplicate data_source_identifier in same org raises IntegrityError."""
        data_source1 = self.factory.create_data_source()
        data_source2 = self.factory.create_data_source()
        db.session.flush()

        metr1 = MetrDataSource(
            data_source_id=data_source1.id,
            org_id=data_source1.org_id,
            data_source_identifier="shared-slug",
        )
        db.session.add(metr1)
        db.session.flush()

        metr2 = MetrDataSource(
            data_source_id=data_source2.id,
            org_id=data_source2.org_id,
            data_source_identifier="shared-slug",  # Same identifier, same org
        )
        db.session.add(metr2)

        with self.assertRaises(IntegrityError):
            db.session.flush()

    def test_allows_multiple_null_data_source_identifiers_in_same_org(self):
        """The unique index is partial, so unassigned identifiers do not collide."""
        data_source1 = self.factory.create_data_source()
        data_source2 = self.factory.create_data_source()
        db.session.flush()

        metr1 = MetrDataSource(data_source_id=data_source1.id, org_id=data_source1.org_id)
        metr2 = MetrDataSource(data_source_id=data_source2.id, org_id=data_source2.org_id)
        db.session.add_all([metr1, metr2])
        db.session.flush()

        self.assertIsNone(metr1.data_source_identifier)
        self.assertIsNone(metr2.data_source_identifier)

    def test_allows_same_data_source_identifier_in_different_orgs(self):
        """Same data_source_identifier allowed across different orgs.

        This is the whole point of the identifier: the template org and every
        customer org carry the same one.
        """
        org1 = self.factory.create_org()
        org2 = self.factory.create_org()

        data_source1 = self.factory.create_data_source(org=org1)
        data_source2 = self.factory.create_data_source(org=org2)
        db.session.flush()

        metr1 = MetrDataSource(
            data_source_id=data_source1.id,
            org_id=org1.id,
            data_source_identifier="same-slug",
        )
        metr2 = MetrDataSource(
            data_source_id=data_source2.id,
            org_id=org2.id,
            data_source_identifier="same-slug",  # Same identifier, different org
        )
        db.session.add_all([metr1, metr2])
        db.session.flush()

        self.assertEqual(metr1.data_source_identifier, "same-slug")
        self.assertEqual(metr2.data_source_identifier, "same-slug")

    def test_prevents_two_sidecars_for_the_same_data_source(self):
        """data_source_id is unique: one sidecar per data source."""
        data_source = self.factory.create_data_source()
        db.session.flush()

        db.session.add(MetrDataSource(data_source_id=data_source.id, org_id=data_source.org_id))
        db.session.flush()

        db.session.add(MetrDataSource(data_source_id=data_source.id, org_id=data_source.org_id))

        with self.assertRaises(IntegrityError):
            db.session.flush()

    def test_deleting_the_data_source_deletes_the_sidecar(self):
        """The relationship cascades, so no orphaned sidecar survives a delete."""
        data_source = self.factory.create_data_source()
        db.session.add(
            MetrDataSource(
                data_source=data_source,
                org_id=data_source.org_id,
                data_source_identifier="doomed",
            )
        )
        db.session.commit()

        data_source.delete()

        self.assertIsNone(MetrDataSource.query.filter_by(data_source_identifier="doomed").first())

    def test_backref_is_reachable_from_the_data_source(self):
        """data_source.metr_data_source is the one-to-one backref."""
        data_source = self.factory.create_data_source()
        metr = MetrDataSource(
            data_source=data_source,
            org_id=data_source.org_id,
            data_source_identifier="remote-monitoring",
        )
        db.session.add(metr)
        db.session.commit()

        self.assertEqual(data_source.metr_data_source, metr)
        self.assertEqual(metr.data_source, data_source)
