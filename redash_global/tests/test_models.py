import pytest
from sqlalchemy.exc import IntegrityError

from redash.models import db
from redash_global.models import (
    ComposedDashboard,
    ComposedDashboardDeployment,
    ComposedDashboardEntry,
    GlobalAdminUser,
)


def test_hash_and_verify_password(create_admin):
    admin = create_admin(password="secret")

    assert admin.password_hash != "secret"
    assert admin.verify_password("secret")
    assert not admin.verify_password("wrong")


def test_get_by_username(create_admin):
    admin = create_admin(username="admin")

    assert GlobalAdminUser.get_by_username("admin").id == admin.id
    assert GlobalAdminUser.get_by_username("nobody") is None


def test_username_must_be_unique(create_admin):
    create_admin(username="admin")

    duplicate = GlobalAdminUser(username="admin")
    duplicate.hash_password("secret")
    db.session.add(duplicate)

    with pytest.raises(IntegrityError):
        db.session.flush()


@pytest.fixture
def composed_dashboard(factory):
    return factory.create_composed_dashboard(url_identifier="details", name="Details")


@pytest.mark.parametrize("value", ["Details", "details overview", "details.overview", "", None])
@pytest.mark.usefixtures("redash_app")
def test_url_identifier_must_be_a_slug(value):
    with pytest.raises(ValueError):
        ComposedDashboard(url_identifier=value, name="Details")


@pytest.mark.parametrize("value", ["details", "details-overview", "details_2"])
@pytest.mark.usefixtures("redash_app")
def test_url_identifier_accepts_slugs(value):
    assert ComposedDashboard(url_identifier=value, name="Details").url_identifier == value


def test_url_identifier_must_be_unique(composed_dashboard):
    db.session.add(ComposedDashboard(url_identifier="details", name="Other Details"))

    with pytest.raises(IntegrityError):
        db.session.flush()


def test_entry_must_be_unique_per_template_dashboard(factory, composed_dashboard):
    dashboard = factory.create_dashboard()
    factory.create_composed_dashboard_entry(
        composed_dashboard_id=composed_dashboard.id, template_dashboard_id=dashboard.id
    )

    db.session.add(
        ComposedDashboardEntry(
            composed_dashboard_id=composed_dashboard.id,
            template_dashboard_id=dashboard.id,
            order_index=1,
        )
    )

    with pytest.raises(IntegrityError):
        db.session.flush()


def test_deployment_must_be_unique_per_organization(factory, composed_dashboard):
    factory.create_composed_dashboard_deployment(
        composed_dashboard_id=composed_dashboard.id, organization_id=factory.org.id
    )

    db.session.add(
        ComposedDashboardDeployment(composed_dashboard_id=composed_dashboard.id, organization_id=factory.org.id)
    )

    with pytest.raises(IntegrityError):
        db.session.flush()


def test_entries_are_ordered_by_order_index(factory, composed_dashboard):
    # Created in reverse, so insertion order cannot pass for order_index order.
    third = factory.create_composed_dashboard_entry(
        composed_dashboard_id=composed_dashboard.id,
        template_dashboard_id=factory.create_dashboard().id,
        order_index=2,
    )
    second = factory.create_composed_dashboard_entry(
        composed_dashboard_id=composed_dashboard.id,
        template_dashboard_id=factory.create_dashboard().id,
        order_index=1,
    )
    first = factory.create_composed_dashboard_entry(
        composed_dashboard_id=composed_dashboard.id,
        template_dashboard_id=factory.create_dashboard().id,
        order_index=0,
    )

    # The entries were created by id, not through the relationship, and order_by
    # only applies when the collection is loaded from the database.
    db.session.expire(composed_dashboard)

    assert [entry.id for entry in composed_dashboard.entries] == [first.id, second.id, third.id]


def test_deleting_composed_dashboard_deletes_entries_and_deployments(factory, composed_dashboard):
    factory.create_composed_dashboard_entry(
        composed_dashboard_id=composed_dashboard.id, template_dashboard_id=factory.create_dashboard().id
    )
    factory.create_composed_dashboard_deployment(
        composed_dashboard_id=composed_dashboard.id, organization_id=factory.org.id
    )

    db.session.delete(composed_dashboard)
    db.session.commit()

    assert ComposedDashboardEntry.query.count() == 0
    assert ComposedDashboardDeployment.query.count() == 0


def test_deleting_template_dashboard_deletes_its_entry(factory, composed_dashboard):
    dashboard = factory.create_dashboard()
    factory.create_composed_dashboard_entry(
        composed_dashboard_id=composed_dashboard.id, template_dashboard_id=dashboard.id
    )

    # Nothing on the ORM side links the two, so this leans on the database's
    # ondelete="CASCADE".
    db.session.delete(dashboard)
    db.session.commit()

    assert ComposedDashboardEntry.query.count() == 0
    assert ComposedDashboard.query.count() == 1
