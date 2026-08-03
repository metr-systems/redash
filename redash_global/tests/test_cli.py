import pytest
from click.testing import CliRunner

from redash_global.cli import create_global_admin, update_global_admin_password
from redash_global.models import GlobalAdminUser

# The CLI commands talk to the database directly, so all they need is the app
# context and empty tables the redash_app fixture sets up.
pytestmark = pytest.mark.usefixtures("redash_app")


@pytest.fixture
def runner():
    return CliRunner()


def test_create_global_admin(runner):
    result = runner.invoke(create_global_admin, ["admin", "--password", "secret"])

    assert not result.exception
    assert result.exit_code == 0

    admin = GlobalAdminUser.get_by_username("admin")
    assert admin is not None
    assert admin.verify_password("secret")


def test_create_global_admin_prompts_for_password(runner):
    result = runner.invoke(create_global_admin, ["admin"], input="secret\nsecret\n")

    assert not result.exception
    assert result.exit_code == 0
    assert GlobalAdminUser.get_by_username("admin").verify_password("secret")


def test_create_global_admin_rejects_duplicate_username(runner):
    runner.invoke(create_global_admin, ["admin", "--password", "secret"])

    result = runner.invoke(create_global_admin, ["admin", "--password", "secret"])

    assert result.exit_code == 1
    assert "already exists" in result.output
    assert GlobalAdminUser.query.count() == 1


def test_update_password(runner):
    runner.invoke(create_global_admin, ["admin", "--password", "secret"])

    result = runner.invoke(update_global_admin_password, ["admin", "newsecret"])

    assert not result.exception
    assert result.exit_code == 0
    admin = GlobalAdminUser.get_by_username("admin")
    assert not admin.verify_password("secret")
    assert admin.verify_password("newsecret")


def test_update_password_unknown_user(runner):
    result = runner.invoke(update_global_admin_password, ["nobody", "newsecret"])

    assert result.exit_code == 1
    assert "not found" in result.output
