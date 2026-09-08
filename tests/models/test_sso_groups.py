from redash.models import Group, db
from tests import BaseTestCase


class SsoGroupTest(BaseTestCase):
    def test_creates_the_group_when_the_organization_has_none(self):
        group = self.factory.org.get_or_create_sso_group()

        self.assertEqual(Group.SSO_GROUP, group.type)
        self.assertEqual(self.factory.org.id, group.org_id)
        self.assertIsNotNone(group.id)

    def test_grants_only_what_reading_a_dashboard_needs(self):
        group = self.factory.org.get_or_create_sso_group()

        self.assertEqual(["list_dashboards", "view_query", "execute_query"], group.permissions)

    def test_returns_the_same_group_on_every_later_login(self):
        first = self.factory.org.get_or_create_sso_group()

        second = self.factory.org.get_or_create_sso_group()

        self.assertEqual(first.id, second.id)
        self.assertEqual(1, Group.query.filter(Group.type == Group.SSO_GROUP).count())

    def test_is_not_the_default_group(self):
        group = self.factory.org.get_or_create_sso_group()

        self.assertNotEqual(self.factory.org.default_group.id, group.id)
