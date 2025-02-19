from funcy import project

from redash.models import DataSource, Group, db
from tests import BaseTestCase


class TestGroupDataSourceListResource(BaseTestCase):
    def test_returns_only_groups_for_current_org(self):
        group = self.factory.create_group(org=self.factory.create_org())
        self.factory.create_data_source(group=group)
        db.session.flush()
        response = self.make_request(
            "get",
            "/api/groups/{}/data_sources".format(group.id),
            user=self.factory.create_admin(),
        )
        self.assertEqual(response.status_code, 404)

    def test_list(self):
        group = self.factory.create_group()
        ds = self.factory.create_data_source(group=group)
        db.session.flush()
        response = self.make_request(
            "get",
            "/api/groups/{}/data_sources".format(group.id),
            user=self.factory.create_admin(),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json), 1)
        self.assertEqual(response.json[0]["id"], ds.id)


class TestGroupDashboardListResource(BaseTestCase):
    def test_post_adds_dashboard_to_group(self):
        group = self.factory.create_group()
        dashboard = self.factory.create_dashboard()

        response = self.make_request(
            "post",
            "/api/groups/{}/dashboards".format(group.id),
            user=self.factory.create_admin(),
            data={"dashboard_id": dashboard.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(group.id, dashboard.groups.keys())
        self.assertEqual(response.json["id"], dashboard.id)

    def test_post_requires_admin(self):
        group = self.factory.create_group()
        dashboard = self.factory.create_dashboard()

        response = self.make_request(
            "post",
            "/api/groups/{}/dashboards".format(group.id),
            data={"dashboard_id": dashboard.id},
        )

        self.assertEqual(response.status_code, 403)

    def test_get_lists_dashboards_for_group(self):
        group = self.factory.create_group()
        dashboard = self.factory.create_dashboard()
        dashboard.add_group(group)
        db.session.commit()

        response = self.make_request(
            "get",
            "/api/groups/{}/dashboards".format(group.id),
            user=self.factory.create_admin(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json), 1)
        self.assertEqual(response.json[0]["id"], dashboard.id)

    def test_get_requires_admin(self):
        group = self.factory.create_group()

        response = self.make_request(
            "get",
            "/api/groups/{}/dashboards".format(group.id),
        )

        self.assertEqual(response.status_code, 403)


class TestGroupDashboardResource(BaseTestCase):
    def test_delete_removes_dashboard_from_group(self):
        group = self.factory.create_group()
        dashboard = self.factory.create_dashboard()
        dashboard.add_group(group)
        db.session.commit()

        response = self.make_request(
            "delete",
            "/api/groups/{}/dashboards/{}".format(group.id, dashboard.id),
            user=self.factory.create_admin(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(group.id, dashboard.groups.keys())

    def test_delete_requires_admin(self):
        group = self.factory.create_group()
        dashboard = self.factory.create_dashboard()
        dashboard.add_group(group)
        db.session.commit()

        response = self.make_request(
            "delete",
            "/api/groups/{}/dashboards/{}".format(group.id, dashboard.id),
        )

        self.assertEqual(response.status_code, 403)


class TestGroupResourceList(BaseTestCase):
    def test_list_admin(self):
        self.factory.create_group(org=self.factory.create_org())
        response = self.make_request("get", "/api/groups", user=self.factory.create_admin())
        g_keys = ["type", "id", "name", "permissions"]

        def filtergroups(gs):
            return [project(g, g_keys) for g in gs]

        self.assertEqual(
            filtergroups(response.json),
            filtergroups(g.to_dict() for g in [self.factory.admin_group, self.factory.default_group]),
        )

    def test_list(self):
        group1 = self.factory.create_group(org=self.factory.create_org(), permissions=["view_dashboard"])
        db.session.flush()
        u = self.factory.create_user(group_ids=[self.factory.default_group.id, group1.id])
        db.session.flush()
        response = self.make_request("get", "/api/groups", user=u)
        g_keys = ["type", "id", "name", "permissions"]

        def filtergroups(gs):
            return [project(g, g_keys) for g in gs]

        self.assertEqual(
            filtergroups(response.json),
            filtergroups(g.to_dict() for g in [self.factory.default_group, group1]),
        )


class TestGroupResourceCreate(BaseTestCase):
    def test_create_group(self):
        admin_user = self.factory.create_admin()
        group_name = "Test Group"

        response = self.make_request(
            "post",
            "/api/groups",
            user=admin_user,
            data={"name": group_name},
        )

        self.assertEqual(response.status_code, 200)
        created_group = Group.query.filter_by(name=group_name, org=admin_user.org).first()
        self.assertIsNotNone(created_group)
        self.assertEqual(created_group.name, group_name)
        self.assertEqual(created_group.permissions, ["list_dashboards", "execute_query"])

    def test_create_group_requires_admin(self):
        user = self.factory.create_user()
        group_name = "Test Group"

        response = self.make_request(
            "post",
            "/api/groups",
            user=user,
            data={"name": group_name},
        )

        self.assertEqual(response.status_code, 403)
        created_group = Group.query.filter_by(name=group_name, org=user.org).first()
        self.assertIsNone(created_group)


class TestGroupResourcePost(BaseTestCase):
    def test_doesnt_change_builtin_groups(self):
        current_name = self.factory.default_group.name

        response = self.make_request(
            "post",
            "/api/groups/{}".format(self.factory.default_group.id),
            user=self.factory.create_admin(),
            data={"name": "Another Name"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(current_name, Group.query.get(self.factory.default_group.id).name)


class TestGroupResourceDelete(BaseTestCase):
    def test_allowed_only_to_admin(self):
        group = self.factory.create_group()

        response = self.make_request("delete", "/api/groups/{}".format(group.id))
        self.assertEqual(response.status_code, 403)

        response = self.make_request(
            "delete",
            "/api/groups/{}".format(group.id),
            user=self.factory.create_admin(),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(Group.query.get(group.id))

    def test_cant_delete_builtin_group(self):
        for group in [self.factory.default_group, self.factory.admin_group]:
            response = self.make_request(
                "delete",
                "/api/groups/{}".format(group.id),
                user=self.factory.create_admin(),
            )
            self.assertEqual(response.status_code, 400)

    def test_can_delete_group_with_data_sources(self):
        group = self.factory.create_group()
        data_source = self.factory.create_data_source(group=group)

        response = self.make_request(
            "delete",
            "/api/groups/{}".format(group.id),
            user=self.factory.create_admin(),
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(data_source, DataSource.query.get(data_source.id))


class TestGroupResourceGet(BaseTestCase):
    def test_returns_group(self):
        rv = self.make_request("get", "/api/groups/{}".format(self.factory.default_group.id))
        self.assertEqual(rv.status_code, 200)

    def test_doesnt_return_if_user_not_member_or_admin(self):
        rv = self.make_request("get", "/api/groups/{}".format(self.factory.admin_group.id))
        self.assertEqual(rv.status_code, 403)
