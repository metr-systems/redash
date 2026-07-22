from redash import security as redash_security
from redash_global import security as global_security
from tests.test_global_auth import GlobalBaseTestCase

TALISMAN_CONFIG_ATTRS = (
    "feature_policy",
    "force_https",
    "force_https_permanent",
    "force_file_save",
    "frame_options",
    "frame_options_allow_from",
    "strict_transport_security",
    "strict_transport_security_preload",
    "strict_transport_security_max_age",
    "strict_transport_security_include_subdomains",
    "content_security_policy",
    "content_security_policy_report_uri",
    "content_security_policy_report_only",
    "content_security_policy_nonce_in",
    "referrer_policy",
    "session_cookie_secure",
)


class GlobalTalismanParityTest(GlobalBaseTestCase):
    """Redash Global mirrors the main app's Talisman hardening. flask-talisman
    stores every ``init_app`` keyword as an attribute on the ``Talisman``
    instance, so once both apps have been built (main app by BaseTestCase,
    global app by GlobalBaseTestCase) we can compare the two singletons
    attribute-for-attribute and fail if the configs ever drift apart.
    """

    def test_talisman_config_matches_main_redash(self):
        redash_config = {attr: getattr(redash_security.talisman, attr) for attr in TALISMAN_CONFIG_ATTRS}
        global_config = {attr: getattr(global_security.talisman, attr) for attr in TALISMAN_CONFIG_ATTRS}

        self.assertEqual(redash_config, global_config)

    def test_session_cookie_http_only_matches_main_redash(self):
        self.assertEqual(
            self.app.config["SESSION_COOKIE_HTTPONLY"],
            self.global_app.config["SESSION_COOKIE_HTTPONLY"],
        )


class GlobalCsrfCookieTest(GlobalBaseTestCase):
    def test_response_sets_readable_csrf_token_cookie(self):
        self._create_admin("admin", "secret")
        self.global_client.post("/login", data={"username": "admin", "password": "secret"})

        response = self.global_client.get("/")

        cookies = response.headers.getlist("Set-Cookie")
        csrf_cookie = next((c for c in cookies if c.startswith("csrf_token=")), None)
        self.assertIsNotNone(csrf_cookie)
        # Must stay JS-readable so the SPA can attach it as the X-CSRFToken header.
        self.assertNotIn("HttpOnly", csrf_cookie)
