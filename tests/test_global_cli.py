from click.testing import CliRunner

from redash_global.cli import create_global_admin, update_global_admin_password
from redash_global.models import GlobalAdminUser
from tests import BaseTestCase


class CreateGlobalAdminTest(BaseTestCase):
    """BaseTestCase is used only for the DB session (app context + tables)."""

    def test_create_global_admin(self):
        """Creating an admin via the CLI persists a verifiable user."""
        runner = CliRunner()
        result = runner.invoke(
            create_global_admin,
            ["admin", "--password", "secret"],
        )

        self.assertFalse(result.exception)
        self.assertEqual(result.exit_code, 0)

        user = GlobalAdminUser.get_by_username("admin")
        self.assertIsNotNone(user)
        self.assertTrue(user.verify_password("secret"))

    def test_create_global_admin_prompts_for_password(self):
        """Password is prompted for when not passed as an option."""
        runner = CliRunner()
        result = runner.invoke(
            create_global_admin,
            ["admin"],
            input="secret\nsecret\n",
        )

        self.assertFalse(result.exception)
        self.assertEqual(result.exit_code, 0)
        self.assertTrue(GlobalAdminUser.get_by_username("admin").verify_password("secret"))

    def test_create_global_admin_rejects_duplicate_username(self):
        """A duplicate username fails without creating a second user."""
        runner = CliRunner()
        runner.invoke(
            create_global_admin,
            ["admin", "--password", "secret"],
        )
        result = runner.invoke(
            create_global_admin,
            ["admin", "--password", "secret"],
        )

        self.assertEqual(result.exit_code, 1)
        self.assertIn("already exists", result.output)
        self.assertEqual(GlobalAdminUser.query.count(), 1)


class UpdateGlobalAdminPasswordTest(BaseTestCase):
    """BaseTestCase is used only for the DB session (app context + tables)."""

    def test_update_password(self):
        """Updating the password replaces the stored hash."""
        runner = CliRunner()
        runner.invoke(
            create_global_admin,
            ["admin", "--password", "secret"],
        )

        result = runner.invoke(update_global_admin_password, ["admin", "newsecret"])

        self.assertFalse(result.exception)
        self.assertEqual(result.exit_code, 0)
        user = GlobalAdminUser.get_by_username("admin")
        self.assertFalse(user.verify_password("secret"))
        self.assertTrue(user.verify_password("newsecret"))

    def test_update_password_unknown_user(self):
        """Updating a missing user fails cleanly."""
        runner = CliRunner()
        result = runner.invoke(update_global_admin_password, ["nobody", "newsecret"])

        self.assertEqual(result.exit_code, 1)
        self.assertIn("not found", result.output)
