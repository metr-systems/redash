import os

from flask_login import user_logged_in

from redash.authentication import log_user_logged_in
from redash.models import db
from redash_global.app import create_global_app
from redash_global.models import GlobalAdminUser
from tests import BaseTestCase


class GlobalBaseTestCase(BaseTestCase):
    """Base for Redash Global tests: reuses BaseTestCase's shared DB/session but
    drives requests through the separate Redash Global app and its own client.

    It also mutes the ``user_logged_in`` signal. BaseTestCase builds the
    main Redash app, which subscribes ``log_user_logged_in`` to flask_login's
    process-global ``user_logged_in`` signal. That handler reads ``user.org_id``,
    which ``GlobalAdminUser`` lacks, so it would crash whenever the global app
    logs a user in. The two apps run in separate processes in production and
    never share the signal; the clash exists only here, where both apps live in
    one pytest process, so we disconnect the handler for the duration of the test
    and restore it afterwards.
    """

    def setUp(self):
        os.environ.setdefault("GLOBAL_SECRET_KEY", "test-global-secret")
        super().setUp()
        user_logged_in.disconnect(log_user_logged_in)
        self.global_app = create_global_app()
        self.global_app.config["TESTING"] = True  #  flips Flask into test mode
        self.global_app.config["WTF_CSRF_ENABLED"] = False  # turns off token validation to make tests easier
        self.global_client = self.global_app.test_client()

    def tearDown(self):
        user_logged_in.connect(log_user_logged_in)
        super().tearDown()

    def _create_admin(self, username="admin", password="secret"):
        user = GlobalAdminUser(username=username)
        user.hash_password(password)
        db.session.add(user)
        db.session.commit()
        return user


class GlobalAuthTest(GlobalBaseTestCase):
    def test_unauthenticated_index_redirects_to_login(self):
        """The SPA at / is gated: no session means a redirect to /login."""
        response = self.global_client.get("/")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.headers["Location"])

    def test_login_with_valid_credentials_sets_session_and_redirects(self):
        """Good credentials log the admin in and redirect to the SPA."""
        self._create_admin("admin", "secret")

        response = self.global_client.post("/login", data={"username": "admin", "password": "secret"})

        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.headers["Location"].endswith("/"))

        # The session persists, so / is now served instead of redirecting.
        index = self.global_client.get("/")
        self.assertEqual(index.status_code, 200)

    def test_login_with_invalid_credentials_shows_error(self):
        """Wrong password re-renders the login page with an error."""
        self._create_admin("admin", "secret")

        response = self.global_client.post("/login", data={"username": "admin", "password": "wrong"})

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Wrong username or password", response.data)
