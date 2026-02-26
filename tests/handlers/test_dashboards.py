from redash.models import (
    AccessPermission,
    ApiKey,
    Dashboard,
    DashboardGroup,
    MetrDashboard,
    db,
)
from redash.permissions import ACCESS_TYPE_MODIFY
from redash.serializers import serialize_dashboard
from redash.utils import json_loads
from tests import BaseTestCase


class TestDashboardListResource(BaseTestCase):
    def test_create_new_dashboard(self):
        dashboard_name = "Test Dashboard"
        rv = self.make_request("post", "/api/dashboards", data={"name": dashboard_name})
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["name"], "Test Dashboard")
        self.assertEqual(rv.json["user_id"], self.factory.user.id)
        self.assertEqual(rv.json["layout"], [])

    def test_default_group_has_access_to_new_dashboard(self):
        dashboard_name = "Test Dashboard"
        rv = self.make_request("post", "/api/dashboards", data={"name": dashboard_name})
        self.assertEqual(rv.status_code, 200)
        dashboard = Dashboard.get_by_id_and_org(rv.json["id"], self.factory.org)
        dashboard_group = DashboardGroup.query.filter(DashboardGroup.dashboard == dashboard).first()
        self.assertIsNotNone(dashboard_group)
        self.assertEqual(dashboard_group.group, self.factory.org.default_group)


class TestDashboardListGetResource(BaseTestCase):
    def test_returns_dashboards(self):
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard()
        d3 = self.factory.create_dashboard()

        rv = self.make_request("get", "/api/dashboards")

        self.assertEqual(len(rv.json["results"]), 3)
        self.assertSetEqual(set([result["id"] for result in rv.json["results"]]), set([d1.id, d2.id, d3.id]))

    def test_filters_with_tags(self):
        d1 = self.factory.create_dashboard(tags=["test"])
        self.factory.create_dashboard()
        self.factory.create_dashboard()

        rv = self.make_request("get", "/api/dashboards?tags=test")
        assert len(rv.json["results"]) == 1
        assert set([result["id"] for result in rv.json["results"]]) == set([d1.id])

    def test_search_term(self):
        d1 = self.factory.create_dashboard(name="Sales")
        d2 = self.factory.create_dashboard(name="Q1 sales")
        self.factory.create_dashboard(name="Ops")

        rv = self.make_request("get", "/api/dashboards?q=sales")
        self.assertEqual(len(rv.json["results"]), 2)
        self.assertSetEqual(set([result["id"] for result in rv.json["results"]]), set([d1.id, d2.id]))

    def test_non_admin_group_dashboard_visibility(self):
        """
        Scenario: Non-admin user should only see dashboards they have access to

        Given a non-admin user
        And a group
        And the non-admin user belongs to the group
        And three dashboards exist
        And the group has access to the first and second dashboards
        And the group has access to a data source and query required to see the dashboards
        And the first and second dashboards have widgets linked to visualizations from the query

        When the non-admin user requests the list of dashboards

        Then the response should contain exactly two dashboards
        And the ids of the dashboards should match the ids of the first and second dashboards
        """
        non_admin_user = self.factory.create_user()
        group = self.factory.create_group(id=5555)
        non_admin_user.group_ids = [group.id]

        d1 = self.factory.create_dashboard(is_draft=False)
        d2 = self.factory.create_dashboard(is_draft=False)
        self.factory.create_dashboard(is_draft=False)

        self.factory.create_dashboard_group_permission(d1, group)
        self.factory.create_dashboard_group_permission(d2, group)

        data_source = self.factory.create_data_source(group=group)
        query = self.factory.create_query(data_source=data_source)
        v1 = self.factory.create_visualization(query_rel=query)
        v2 = self.factory.create_visualization(query_rel=query)
        self.factory.create_widget(visualization=v1, dashboard=d1)
        self.factory.create_widget(visualization=v2, dashboard=d2)

        db.session.commit()

        rv = self.make_request("get", "/api/dashboards", user=non_admin_user)

        self.assertEqual(len(rv.json["results"]), 2)
        self.assertSetEqual(set([result["id"] for result in rv.json["results"]]), set([d1.id, d2.id]))


class TestDashboardResourceGetByAdmin(BaseTestCase):
    def test_get_dashboard_by_admin(self):
        d1 = self.factory.create_dashboard()
        admin = self.factory.create_admin()
        rv = self.make_request("get", "/api/dashboards/{0}".format(d1.id), user=admin)
        self.assertEqual(rv.status_code, 200)

        expected = serialize_dashboard(d1, with_widgets=True, with_favorite_state=False)
        actual = json_loads(rv.data)

        self.assertResponseEqual(expected, actual)

    def test_admin_sees_all_dashboards(self):
        admin = self.factory.create_admin()
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard()
        d3 = self.factory.create_dashboard()

        db.session.commit()

        rv = self.make_request("get", "/api/dashboards", user=admin)

        self.assertEqual(len(rv.json["results"]), 3)
        self.assertSetEqual(set([result["id"] for result in rv.json["results"]]), set([d1.id, d2.id, d3.id]))

    def test_get_dashboard_with_slug_by_admin(self):
        d1 = self.factory.create_dashboard()
        admin = self.factory.create_admin()
        rv = self.make_request("get", "/api/dashboards/{0}?legacy".format(d1.slug), user=admin)
        self.assertEqual(rv.status_code, 200)

        expected = serialize_dashboard(d1, with_widgets=True, with_favorite_state=False)
        actual = json_loads(rv.data)

        self.assertResponseEqual(expected, actual)

    def test_get_non_existing_dashboard_by_admin(self):
        admin = self.factory.create_admin()
        rv = self.make_request("get", "/api/dashboards/-1", user=admin)
        self.assertEqual(rv.status_code, 404)

    def test_get_dashboard_with_url_identifier_by_admin(self):
        """Test that admin gets dashboard with url_identifier when metr_dashboard exists."""
        dashboard = self.factory.create_dashboard()
        admin = self.factory.create_admin()
        db.session.flush()

        # Create associated MetrDashboard with url_identifier
        metr_dashboard = MetrDashboard(dashboard_id=dashboard.id, org_id=dashboard.org_id, url_identifier="details")
        db.session.add(metr_dashboard)
        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=admin)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["url_identifier"], "details")

    def test_get_dashboard_without_metr_dashboard_by_admin(self):
        """Test that admin gets dashboard with None url_identifier when no metr_dashboard exists."""
        dashboard = self.factory.create_dashboard()
        admin = self.factory.create_admin()

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=admin)
        self.assertEqual(rv.status_code, 200)
        self.assertIsNone(rv.json["url_identifier"])


class TestDashboardResourceGetByCustom(BaseTestCase):
    def test_get_dashboard_by_custom_requires_group_access(self):
        """
        Scenario: Get dashboard by custom requires group access

        Given a dashboard exists
        And a group exists
        And a user exists who belongs to the group
        When the user makes a GET request to the dashboard API endpoint
        without permission to access the dashboard
        Then the response status code should be 403 (Forbidden)

        Given another user exists who belongs to the group
        And the group has permission to access the dashboard
        When the user with access makes a GET request to the dashboard API endpoint
        Then the response status code should be 200 (OK)
        """
        dashboard = self.factory.create_dashboard()
        group = self.factory.create_group()
        user = self.factory.create_user()
        user.group_ids = [group.id]

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=user)
        self.assertEqual(rv.status_code, 403)

        user_with_access = self.factory.create_user()
        user_with_access.group_ids = [group.id]

        self.factory.create_dashboard_group_permission(dashboard, group)
        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=user_with_access)
        self.assertEqual(rv.status_code, 200)

    def test_get_dashboard_by_custom(self):
        d1 = self.factory.create_dashboard()
        group = self.factory.create_group()
        user = self.factory.create_user()
        user.group_ids = [group.id]
        self.factory.create_dashboard_group_permission(d1, group)
        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}".format(d1.id), user=user)
        self.assertEqual(rv.status_code, 200)

        expected = serialize_dashboard(d1, with_widgets=True, with_favorite_state=False)
        actual = json_loads(rv.data)

        self.assertResponseEqual(expected, actual)

    def test_get_dashboard_with_slug_by_custom(self):
        d1 = self.factory.create_dashboard()
        group = self.factory.create_group()
        user = self.factory.create_user()
        user.group_ids = [group.id]
        self.factory.create_dashboard_group_permission(d1, group)
        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}?legacy".format(d1.slug), user=user)
        self.assertEqual(rv.status_code, 200)

        expected = serialize_dashboard(d1, with_widgets=True, with_favorite_state=False)
        actual = json_loads(rv.data)

        self.assertResponseEqual(expected, actual)

    def test_get_dashboard_by_custom_filters_unauthorized_widgets(self):
        dashboard = self.factory.create_dashboard()
        group = self.factory.create_group()
        user = self.factory.create_user()
        user.group_ids = [group.id]
        self.factory.create_dashboard_group_permission(dashboard, group)

        restricted_ds = self.factory.create_data_source(group=self.factory.create_group())
        query = self.factory.create_query(data_source=restricted_ds)
        vis = self.factory.create_visualization(query_rel=query)
        restricted_widget = self.factory.create_widget(visualization=vis, dashboard=dashboard)

        accessible_ds = self.factory.create_data_source(group=group)
        accessible_query = self.factory.create_query(data_source=accessible_ds)
        accessible_vis = self.factory.create_visualization(query_rel=accessible_query)
        accessible_widget = self.factory.create_widget(visualization=accessible_vis, dashboard=dashboard)
        dashboard.layout = [[accessible_widget.id, restricted_widget.id]]

        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=user)
        self.assertEqual(rv.status_code, 200)
        self.assertTrue(len(rv.json["widgets"]) == 2)
        self.assertTrue(rv.json["widgets"][0]["restricted"])
        self.assertNotIn("restricted", rv.json["widgets"][1])

    def test_get_non_existing_dashboard_by_custom(self):
        rv = self.make_request("get", "/api/dashboards/-1")
        self.assertEqual(rv.status_code, 404)

    def test_get_dashboard_with_url_identifier_by_custom(self):
        """Test that custom user cannot see url_identifier even when metr_dashboard exists."""
        dashboard = self.factory.create_dashboard()
        group = self.factory.create_group()
        user = self.factory.create_user()
        user.group_ids = [group.id]
        self.factory.create_dashboard_group_permission(dashboard, group)
        db.session.flush()

        # Create associated MetrDashboard with url_identifier
        metr_dashboard = MetrDashboard(dashboard_id=dashboard.id, org_id=dashboard.org_id, url_identifier="details")
        db.session.add(metr_dashboard)
        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=user)
        self.assertEqual(rv.status_code, 200)
        # Custom users should not see URL identifier for security reasons
        self.assertNotIn("url_identifier", rv.json)

    def test_get_dashboard_without_metr_dashboard_by_custom(self):
        """Test that custom user cannot see url_identifier when no metr_dashboard exists."""
        dashboard = self.factory.create_dashboard()
        group = self.factory.create_group()
        user = self.factory.create_user()
        user.group_ids = [group.id]
        self.factory.create_dashboard_group_permission(dashboard, group)
        db.session.commit()

        rv = self.make_request("get", "/api/dashboards/{0}".format(dashboard.id), user=user)
        self.assertEqual(rv.status_code, 200)
        # Custom users should not see URL identifier field at all for security reasons
        self.assertNotIn("url_identifier", rv.json)


class TestDashboardResourcePost(BaseTestCase):
    def test_update_dashboard(self):
        d = self.factory.create_dashboard()
        new_name = "New Name"
        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(d.id),
            data={"name": new_name, "layout": []},
        )
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["name"], new_name)

    def test_raises_error_in_case_of_conflict(self):
        d = self.factory.create_dashboard()
        d.name = "Updated"
        db.session.commit()
        new_name = "New Name"
        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(d.id),
            data={"name": new_name, "layout": [], "version": d.version - 1},
        )

        self.assertEqual(rv.status_code, 409)

    def test_overrides_existing_if_no_version_specified(self):
        d = self.factory.create_dashboard()
        d.name = "Updated"

        new_name = "New Name"
        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(d.id),
            data={"name": new_name, "layout": []},
        )

        self.assertEqual(rv.status_code, 200)

    def test_works_for_non_owner_with_permission(self):
        d = self.factory.create_dashboard()
        user = self.factory.create_user()

        new_name = "New Name"
        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(d.id),
            data={"name": new_name, "layout": [], "version": d.version},
            user=user,
        )
        self.assertEqual(rv.status_code, 403)

        AccessPermission.grant(obj=d, access_type=ACCESS_TYPE_MODIFY, grantee=user, grantor=d.user)

        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(d.id),
            data={"name": new_name, "layout": [], "version": d.version},
            user=user,
        )

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["name"], new_name)

    def test_update_dashboard_with_url_identifier(self):
        """Test updating dashboard with URL identifier."""
        dashboard = self.factory.create_dashboard()
        new_name = "New Name"
        url_identifier = "my-custom-slug"

        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(dashboard.id),
            data={"name": new_name, "layout": [], "url_identifier": url_identifier},
        )

        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["name"], new_name)

        # Check that MetrDashboard was created/updated
        metr_dashboard = MetrDashboard.query.filter_by(dashboard_id=dashboard.id).first()
        self.assertIsNotNone(metr_dashboard)
        self.assertEqual(metr_dashboard.url_identifier, url_identifier)

    def test_update_dashboard_creates_metr_dashboard_if_not_exists(self):
        """Test that updating dashboard creates MetrDashboard record if it doesn't exist."""
        dashboard = self.factory.create_dashboard()

        # Ensure no MetrDashboard exists
        existing = MetrDashboard.query.filter_by(dashboard_id=dashboard.id).first()
        self.assertIsNone(existing)

        rv = self.make_request(
            "post",
            "/api/dashboards/{0}".format(dashboard.id),
            data={"name": "Updated Name", "layout": [], "url_identifier": "new-slug"},
        )

        self.assertEqual(rv.status_code, 200)

        # Check that MetrDashboard was created
        metr_dashboard = MetrDashboard.query.filter_by(dashboard_id=dashboard.id).first()
        self.assertIsNotNone(metr_dashboard)
        self.assertEqual(metr_dashboard.url_identifier, "new-slug")
        self.assertEqual(metr_dashboard.org_id, dashboard.org_id)


class TestDashboardForkResourcePost(BaseTestCase):
    def test_forks_a_dashboard(self):
        dashboard = self.factory.create_dashboard()

        rv = self.make_request("post", "/api/dashboards/{}/fork".format(dashboard.id))

        self.assertEqual(rv.status_code, 200)


class TestDashboardResourceDelete(BaseTestCase):
    def test_delete_dashboard(self):
        d = self.factory.create_dashboard()

        rv = self.make_request("delete", "/api/dashboards/{0}".format(d.id))
        self.assertEqual(rv.status_code, 200)

        d = Dashboard.get_by_id_and_org(d.id, d.org)
        self.assertTrue(d.is_archived)


class TestDashboardShareResourcePost(BaseTestCase):
    def test_creates_api_key(self):
        dashboard = self.factory.create_dashboard()

        res = self.make_request("post", "/api/dashboards/{}/share".format(dashboard.id))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json["api_key"], ApiKey.get_by_object(dashboard).api_key)

    def test_requires_admin_or_owner(self):
        dashboard = self.factory.create_dashboard()
        user = self.factory.create_user()

        res = self.make_request("post", "/api/dashboards/{}/share".format(dashboard.id), user=user)
        self.assertEqual(res.status_code, 403)

        user.group_ids.append(self.factory.org.admin_group.id)

        res = self.make_request("post", "/api/dashboards/{}/share".format(dashboard.id), user=user)
        self.assertEqual(res.status_code, 200)


class TestDashboardShareResourceDelete(BaseTestCase):
    def test_disables_api_key(self):
        dashboard = self.factory.create_dashboard()
        ApiKey.create_for_object(dashboard, self.factory.user)

        res = self.make_request("delete", "/api/dashboards/{}/share".format(dashboard.id))
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(ApiKey.get_by_object(dashboard))

    def test_ignores_when_no_api_key_exists(self):
        dashboard = self.factory.create_dashboard()

        res = self.make_request("delete", "/api/dashboards/{}/share".format(dashboard.id))
        self.assertEqual(res.status_code, 200)

    def test_requires_admin_or_owner(self):
        dashboard = self.factory.create_dashboard()
        user = self.factory.create_user()

        res = self.make_request("delete", "/api/dashboards/{}/share".format(dashboard.id), user=user)
        self.assertEqual(res.status_code, 403)

        user.group_ids.append(self.factory.org.admin_group.id)

        res = self.make_request("delete", "/api/dashboards/{}/share".format(dashboard.id), user=user)
        self.assertEqual(res.status_code, 200)
