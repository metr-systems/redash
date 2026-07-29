import pytest
from flask_login import user_logged_in

from redash import limiter, redis_connection
from redash.app import create_app
from redash.authentication import log_user_logged_in
from redash.models import db
from redash_global.app import create_global_app
from redash_global.models import GlobalAdminUser
from redash_global.security import limiter as global_limiter
from tests.factories import Factory


@pytest.fixture(autouse=True, scope="session")
def stub_babel_gettext():
    """Return translated strings as-is, like the main suite's conftest does.

    Needed here too, and before any app is built: ``create_app`` imports the
    Redash handlers lazily and they bind ``flask_babel._`` at import time, so
    whichever suite creates the first app decides whether the whole process gets
    real translations. BABEL_DEFAULT_LOCALE is "de", so leaving them in place
    would fail every main-suite test that asserts on an English message.
    """
    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr("flask_babel._", lambda *args, **kwargs: args[0])
        yield


@pytest.fixture
def redash_app():
    """The main Redash app, with an app context pushed and empty tables.

    Redash Global has no database of its own, so its tests get their schema and
    session from here. Tests that only need the database can pull this in with
    ``@pytest.mark.usefixtures("redash_app")``.
    """
    app = create_app()
    app.config["TESTING"] = True
    limiter.enabled = False

    app_ctx = app.app_context()
    app_ctx.push()
    db.session.close()
    db.drop_all()
    db.create_all()

    yield app

    db.session.remove()
    db.get_engine(app).dispose()
    app_ctx.pop()
    redis_connection.flushdb()


@pytest.fixture
def factory(redash_app):
    """The main suite's model factory, for orgs, users and dashboards."""
    return Factory()


@pytest.fixture
def app(redash_app):
    """The Redash Global app, sharing ``redash_app``'s database and session.

    Requesting ``redash_app`` is what creates the tables and pushes an app
    context, so each Redash Global test builds one main app and one global app.

    This also mutes the ``user_logged_in`` signal. The main Redash app
    subscribes ``log_user_logged_in`` to flask_login's process-global
    ``user_logged_in`` signal. That handler reads ``user.org_id``, which
    ``GlobalAdminUser`` lacks, so it would crash whenever the global app logs a
    user in. The two apps run in separate processes in production and never
    share the signal; the clash exists only here, where both apps live in one
    pytest process, so we disconnect the handler for the duration of the test
    and restore it afterwards.
    """
    user_logged_in.disconnect(log_user_logged_in)

    app = create_global_app()
    app.config["TESTING"] = True  # flips Flask into test mode
    app.config["WTF_CSRF_ENABLED"] = False  # turns off token validation to make tests easier
    global_limiter.enabled = False  # login throttling would otherwise leak between tests

    yield app

    user_logged_in.connect(log_user_logged_in)


@pytest.fixture
def client(app):
    """Anonymous client for the Redash Global app."""
    return app.test_client()


@pytest.fixture
def create_admin(redash_app):
    """Creates Redash Global admins. Defaults to ``admin`` / ``secret``."""

    def create(username="admin", password="secret"):
        admin = GlobalAdminUser(username=username)
        admin.hash_password(password)
        db.session.add(admin)
        db.session.commit()
        return admin

    return create


@pytest.fixture
def admin(create_admin):
    """A Redash Global admin with the password ``secret``."""
    return create_admin()


@pytest.fixture
def admin_client(client, admin):
    """Client for the Redash Global app, logged in as ``admin``."""
    client.post("/login", data={"username": admin.username, "password": "secret"})
    return client
