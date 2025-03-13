from mock import MagicMock, patch

from redash import models
from redash.models import Dashboard, db
from tests import BaseTestCase


class DashboardTest(BaseTestCase):
    def create_tagged_dashboard(self, tags):
        dashboard = self.factory.create_dashboard(tags=tags)
        ds = self.factory.create_data_source(group=self.factory.default_group)
        query = self.factory.create_query(data_source=ds)
        # We need a bunch of visualizations and widgets configured
        # to trigger wrong counts via the left outer joins.
        vis1 = self.factory.create_visualization(query_rel=query)
        vis2 = self.factory.create_visualization(query_rel=query)
        vis3 = self.factory.create_visualization(query_rel=query)
        widget1 = self.factory.create_widget(visualization=vis1, dashboard=dashboard)
        widget2 = self.factory.create_widget(visualization=vis2, dashboard=dashboard)
        widget3 = self.factory.create_widget(visualization=vis3, dashboard=dashboard)
        dashboard.layout = [[widget1.id, widget2.id, widget3.id]]
        db.session.commit()
        return dashboard

    def test_all_tags(self):
        self.create_tagged_dashboard(tags=["tag1"])
        self.create_tagged_dashboard(tags=["tag1", "tag2"])
        self.create_tagged_dashboard(tags=["tag1", "tag2", "tag3"])

        self.assertEqual(
            list(Dashboard.all_tags(self.factory.org, self.factory.user)),
            [("tag1", 3), ("tag2", 2), ("tag3", 1)],
        )


class TestDashboardsByUser(BaseTestCase):
    def test_returns_only_users_dashboards(self):
        d = self.factory.create_dashboard(user=self.factory.user)
        d2 = self.factory.create_dashboard(user=self.factory.create_user())

        dashboards = Dashboard.by_user(self.factory.user)

        # not using self.assertIn/NotIn because otherwise this fails :O
        self.assertTrue(d in list(dashboards))
        self.assertFalse(d2 in list(dashboards))

    def test_returns_drafts_by_the_user(self):
        d = self.factory.create_dashboard(is_draft=True)
        d2 = self.factory.create_dashboard(is_draft=True, user=self.factory.create_user())

        dashboards = Dashboard.by_user(self.factory.user)

        # not using self.assertIn/NotIn because otherwise this fails :O
        self.assertTrue(d in dashboards)
        self.assertFalse(d2 in dashboards)

    def test_returns_correct_number_of_dashboards(self):
        # Solving https://github.com/getredash/redash/issues/5466

        usr = self.factory.create_user()

        ds1 = self.factory.create_data_source()
        ds2 = self.factory.create_data_source()

        qry1 = self.factory.create_query(data_source=ds1, user=usr)
        qry2 = self.factory.create_query(data_source=ds2, user=usr)

        viz1 = self.factory.create_visualization(
            query_rel=qry1,
        )
        viz2 = self.factory.create_visualization(
            query_rel=qry2,
        )

        def create_dashboard():
            dash = self.factory.create_dashboard(name="boy howdy", user=usr)
            self.factory.create_widget(dashboard=dash, visualization=viz1)
            self.factory.create_widget(dashboard=dash, visualization=viz2)

            return dash

        create_dashboard()
        create_dashboard()

        results = Dashboard.all(self.factory.org, usr.group_ids, usr.id)

        self.assertEqual(2, results.count(), "The incorrect number of dashboards were returned")


def _set_up_dashboard_test(d):
    d.g1 = d.factory.create_group(name="First", permissions=["create", "view"])
    d.g2 = d.factory.create_group(name="Second", permissions=["create", "view"])
    d.ds1 = d.factory.create_data_source()
    d.ds2 = d.factory.create_data_source()
    db.session.flush()
    d.u1 = d.factory.create_user(group_ids=[d.g1.id])
    d.u2 = d.factory.create_user(group_ids=[d.g2.id])
    db.session.add_all(
        [
            models.DataSourceGroup(group=d.g1, data_source=d.ds1),
            models.DataSourceGroup(group=d.g2, data_source=d.ds2),
        ]
    )
    d.q1 = d.factory.create_query(data_source=d.ds1)
    d.q2 = d.factory.create_query(data_source=d.ds2)
    d.v1 = d.factory.create_visualization(query_rel=d.q1)
    d.v2 = d.factory.create_visualization(query_rel=d.q2)
    d.w1 = d.factory.create_widget(visualization=d.v1)
    d.w2 = d.factory.create_widget(visualization=d.v2)
    d.w3 = d.factory.create_widget(visualization=d.v2, dashboard=d.w2.dashboard)
    d.w4 = d.factory.create_widget(visualization=d.v2)
    d.w5 = d.factory.create_widget(visualization=d.v1, dashboard=d.w4.dashboard)
    db.session.add_all(
        [
            models.DashboardGroup(group=d.g1, dashboard=d.w1.dashboard),
        ]
    )
    d.w1.dashboard.is_draft = False
    d.w2.dashboard.is_draft = False
    d.w4.dashboard.is_draft = False


def _get_dashboards(org, group_ids, user_id, is_admin=False):
    return list(models.Dashboard.all(org, group_ids, user_id, is_admin))


class TestDashboardAllForCreator(BaseTestCase):
    def setUp(self):
        super(TestDashboardAllForCreator, self).setUp()
        _set_up_dashboard_test(self)

    def test_creator_can_see_dashboard(self):
        d1 = self.factory.create_dashboard()
        self.assertIn(d1, _get_dashboards(d1.user.org, [], d1.user.id))

    def test_creator_can_see_draft_dashboard(self):
        d1 = self.factory.create_dashboard(is_draft=True)
        self.assertIn(d1, _get_dashboards(d1.user.org, [], d1.user.id))

    def test_returns_dashboards_created_by_user(self):
        d1 = self.factory.create_dashboard(user=self.u1)
        db.session.flush()
        self.assertIn(d1, _get_dashboards(self.u1.org, self.u1.group_ids, self.u1.id))
        self.assertIn(d1, _get_dashboards(self.u1.org, [0], self.u1.id))
        self.assertNotIn(d1, _get_dashboards(self.u2.org, self.u2.group_ids, self.u2.id))

    def test_returns_dashboards_with_text_widgets_to_creator(self):
        w1 = self.factory.create_widget(visualization=None)

        self.assertEqual(w1.dashboard.user, self.factory.user)

        dashboards = _get_dashboards(self.factory.user.org, self.factory.user.group_ids, self.factory.user.id)
        self.assertIn(w1.dashboard, dashboards)

        dashboards = _get_dashboards(self.u1.org, self.u1.group_ids, self.u1.id)
        self.assertNotIn(w1.dashboard, dashboards)

    def test_returns_each_dashboard_once(self):
        user = self.factory.create_user(group_ids=[self.g1.id, self.g2.id])
        dashboard = self.factory.create_dashboard(user=self.u2)

        # dashboard has access from the two groups
        db.session.add_all(
            [
                models.DashboardGroup(group=self.g1, dashboard=dashboard),
                models.DashboardGroup(group=self.g2, dashboard=dashboard),
            ]
        )
        db.session.flush()

        dashboards = _get_dashboards(self.u2.org, [self.g1.id, self.g2.id], user.id)
        self.assertEqual(len(dashboards), 1)


class TestDashboardAllForNonAdmin(BaseTestCase):
    def setUp(self):
        super(TestDashboardAllForNonAdmin, self).setUp()
        _set_up_dashboard_test(self)

    def test_dashboard_visibility_based_on_dashboards_group_access(self):
        # g1, group of u1, has access to data source ds1 and to dashboard d1
        self.assertIn(self.w1.dashboard, _get_dashboards(self.u1.org, self.u1.group_ids, None))
        self.assertNotIn(self.w2.dashboard, _get_dashboards(self.u2.org, self.u2.group_ids, None))
        self.assertNotIn(self.w1.dashboard, _get_dashboards(self.u2.org, self.u2.group_ids, None))
        self.assertNotIn(self.w2.dashboard, _get_dashboards(self.u1.org, self.u1.group_ids, None))

    def test_dashboards_visibility_based_on_data_sources_group_access(self):
        db.session.add(models.DashboardGroup(group=self.g2, dashboard=self.w2.dashboard))
        db.session.flush()
        # g1, group of u1, has access to data source ds1 and to dashboard d1
        self.assertIn(self.w1.dashboard, _get_dashboards(self.u1.org, self.u1.group_ids, None))
        self.assertNotIn(self.w1.dashboard, _get_dashboards(self.u2.org, self.u2.group_ids, None))

        # g2, group of u2, has access to data source ds2 and to dashboard d2
        self.assertIn(self.w2.dashboard, _get_dashboards(self.u2.org, self.u2.group_ids, None))
        self.assertNotIn(self.w2.dashboard, _get_dashboards(self.u1.org, self.u1.group_ids, None))

    def test_return_dashboard_you_have_partial_data_source_access_to(self):
        user = self.factory.create_user(group_ids=[self.g1.id])
        db.session.add(models.DashboardGroup(group=self.g1, dashboard=self.w5.dashboard))

        # widget W5 has a query from ds1 , the dashboard has also widgets from queries from ds2
        self.assertIn(
            self.w5.dashboard,
            models.Dashboard.all(self.u1.org, user.group_ids, None),
        )

    def test_returns_dashboards_from_current_org_only(self):
        dashboard = self.factory.create_widget().dashboard
        user_other_org = self.factory.create_user(org=self.factory.create_org())
        user_same_org = self.factory.create_user()

        db.session.add(models.DashboardGroup(group=self.factory.default_group, dashboard=dashboard))
        db.session.flush()

        dashboards_same_org = _get_dashboards(self.factory.user.org, self.factory.user.group_ids, user_same_org.id)
        self.assertIn(dashboard, dashboards_same_org)

        dashboards_other_org = _get_dashboards(user_other_org.org, user_other_org.group_ids, user_other_org.id)
        self.assertNotIn(dashboard, dashboards_other_org)


class TestDashboardAllForAdmin(BaseTestCase):
    def test_returns_dashboards_from_current_org_only(self):
        dashboard = self.factory.create_widget().dashboard
        user_other_org = self.factory.create_user(org=self.factory.create_org())
        user_same_org = self.factory.create_user()

        dashboards_same_org = _get_dashboards(
            self.factory.user.org, self.factory.user.group_ids, user_same_org.id, True
        )
        dashboards_other_org = _get_dashboards(user_other_org.org, user_other_org.group_ids, user_other_org.id, True)
        self.assertIn(dashboard, dashboards_same_org)
        self.assertNotIn(dashboard, dashboards_other_org)


class TestDashboardSearch(BaseTestCase):
    def setUp(self):
        super(TestDashboardSearch, self).setUp()
        self.mock_all_patcher = patch("redash.models.Dashboard.all")
        self.mock_all = self.mock_all_patcher.start()
        _set_up_dashboard_test(self)

    def tearDown(self):
        super(TestDashboardSearch, self).tearDown()
        self.mock_all_patcher.stop()

    def test_search(self):
        self.factory.create_dashboard(user=self.u1, name="test")

        MagicMock()
        user_id = self.u1.id
        search_term = "test"
        is_admin = False

        models.Dashboard.search(self.u1.org, self.u1.group_ids, user_id, search_term, is_admin)
        self.mock_all.assert_called_once_with(self.u1.org, self.u1.group_ids, user_id, is_admin)
