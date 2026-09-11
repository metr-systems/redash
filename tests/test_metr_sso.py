"""
Tests for the core-backend hand-off. Redash's own JWT support, which these do not
exercise, is tested in test_authentication.py alongside the other providers.
"""

import json
import os
import subprocess
import time
from unittest.mock import patch

import jwt
from flask import Flask

from redash import models
from redash.authentication import jwt_auth, metr_sso
from redash.authentication.metr_sso import MisconfiguredError
from redash.settings import metr as metr_settings
from tests import BaseTestCase, authenticate_request


def a_signing_key(name, bits="2048"):
    private_key = "/tmp/metr_sso_{}.key".format(name)
    public_key = "/tmp/metr_sso_{}.pem".format(name)
    if not os.path.exists(public_key):
        subprocess.check_output(["openssl", "genrsa", "-out", private_key, bits])
        subprocess.check_output(
            ["openssl", "rsa", "-pubout", "-in", private_key, "-out", public_key]
        )
    with open(private_key) as keyfile:
        return keyfile.read().strip()


class HandOffTestCase(BaseTestCase):
    audience = "metr-dashboards"
    issuer = "https://sso.metr.systems"
    cookie_name = "metr_dashboards_sso"

    def setUp(self):
        super(HandOffTestCase, self).setUp()
        self.signing_key = a_signing_key("default")

        self.configure(
            SSO_LOGIN_URL="https://{org_slug}.metr.systems/sso/dashboards/",
            SSO_CALLBACK_JWKS_URL="file:///tmp/metr_sso_default.pem",
            SSO_ISSUER=self.issuer,
            SSO_AUDIENCE=self.audience,
            SSO_ALGORITHMS=["RS256"],
            SSO_COOKIE_NAME=self.cookie_name,
            SSO_COOKIE_DOMAIN="",
            SSO_TENANT_CLAIM="tenant",
        )

        # Keyed by URL and kept for the life of the process, so it outlives a test
        jwt_auth.get_public_keys.key_cache.clear()
        self.addCleanup(jwt_auth.get_public_keys.key_cache.clear)

    def configure(self, **settings):
        for name, value in settings.items():
            patched = patch.object(metr_settings, name, value)
            patched.start()
            self.addCleanup(patched.stop)

    def a_ticket(self, email, key=None, **overrides):
        """A ticket for this organization. Override a claim, or drop it with None."""
        issued_at = time.time()
        claims = {
            "iss": self.issuer,
            "aud": self.audience,
            "email": email,
            "tenant": self.factory.org.slug,
            "iat": issued_at,
            "exp": issued_at + 60,
        }
        claims.update(overrides)
        claims = {name: value for name, value in claims.items() if value is not None}
        return jwt.encode(claims, key or self.signing_key, algorithm="RS256")

    def spend(self, ticket, next_path=None, org=None):
        org = org or self.factory.org
        self.client.set_cookie(self.cookie_name, ticket)
        path = "/{}/metr/callback".format(org.slug)
        if next_path:
            path = "{}?next={}".format(path, next_path)
        return self.client.get(path)

    def signed_in_email(self, org=None):
        org = org or self.factory.org
        response = self.client.get("/{}/api/session".format(org.slug))
        if response.status_code != 200:
            return None
        return json.loads(response.data)["user"]["email"]

    def cookie_headers(self, response):
        return [
            header
            for header in response.headers.getlist("Set-Cookie")
            if header.startswith(self.cookie_name + "=")
        ]


class TestSpendingATicket(HandOffTestCase):
    def test_it_signs_the_visitor_in(self):
        user = self.factory.create_user()

        self.spend(self.a_ticket(user.email))

        self.assertEqual(user.email, self.signed_in_email())

    def test_the_session_outlives_the_ticket(self):
        user = self.factory.create_user()

        self.spend(self.a_ticket(user.email))
        self.client.delete_cookie(self.cookie_name)

        self.assertEqual(user.email, self.signed_in_email())

    def test_the_ticket_is_spent_rather_than_left_lying_around(self):
        user = self.factory.create_user()

        response = self.spend(self.a_ticket(user.email))

        spent = self.cookie_headers(response)
        self.assertEqual(1, len(spent))
        self.assertIn("Expires=Thu, 01 Jan 1970", spent[0])

    def test_it_signs_out_whoever_was_signed_in_before(self):
        already_here = self.factory.create_user(email="already@example.com")
        arriving = self.factory.create_user(email="arriving@example.com")
        authenticate_request(self.client, already_here)

        self.spend(self.a_ticket(arriving.email))

        self.assertEqual(arriving.email, self.signed_in_email())

    def test_logging_out_afterwards_stays_logged_out(self):
        user = self.factory.create_user()
        self.spend(self.a_ticket(user.email))

        self.client.get("/{}/logout".format(self.factory.org.slug))

        self.assertIsNone(self.signed_in_email())

    def test_it_returns_the_visitor_to_the_page_they_asked_for(self):
        user = self.factory.create_user()
        next_path = "/{}/dashboard/overview".format(self.factory.org.slug)

        response = self.spend(self.a_ticket(user.email), next_path=next_path)

        self.assertEqual(302, response.status_code)
        self.assertTrue(response.headers["Location"].endswith(next_path))

    def test_it_refuses_a_return_path_leaving_the_dashboards(self):
        user = self.factory.create_user()

        response = self.spend(self.a_ticket(user.email), next_path="https://evil.example/steal")

        self.assertNotIn("evil.example", response.headers["Location"])


class TestRefusingATicket(HandOffTestCase):
    def test_a_ticket_for_another_organization_is_refused(self):
        user = self.factory.create_user()

        self.spend(self.a_ticket(user.email, tenant="somewhere-else"))

        self.assertIsNone(self.signed_in_email())

    def test_a_ticket_naming_no_tenant_is_refused(self):
        user = self.factory.create_user()

        self.spend(self.a_ticket(user.email, tenant=None))

        self.assertIsNone(self.signed_in_email())

    def test_a_ticket_nobody_signed_is_refused(self):
        self.factory.create_user()

        response = self.spend("not-a-token")

        self.assertEqual(302, response.status_code)
        self.assertIsNone(self.signed_in_email())

    def test_a_ticket_signed_by_somewhere_else_is_refused(self):
        user = self.factory.create_user()
        elsewhere = a_signing_key("elsewhere")

        self.spend(self.a_ticket(user.email, key=elsewhere))

        self.assertIsNone(self.signed_in_email())

    def test_a_refused_ticket_is_thrown_away_too(self):
        self.factory.create_user()

        response = self.spend("not-a-token")

        self.assertEqual(1, len(self.cookie_headers(response)))

    def test_a_ticket_for_somebody_disabled_here_is_refused(self):
        user = self.factory.create_user()
        user.disabled_at = user.created_at
        self.db.session.commit()

        self.spend(self.a_ticket(user.email))

        self.assertIsNone(self.signed_in_email())

    def test_arriving_with_no_ticket_at_all_is_refused(self):
        self.factory.create_user()

        response = self.client.get("/{}/metr/callback".format(self.factory.org.slug))

        self.assertEqual(302, response.status_code)
        self.assertIsNone(self.signed_in_email())

    def test_keys_that_cannot_be_read_refuse_the_login(self):
        self.configure(SSO_CALLBACK_JWKS_URL="file:///tmp/metr_sso_absent_{org_slug}.pem")
        user = self.factory.create_user()

        response = self.spend(self.a_ticket(user.email))

        self.assertEqual(302, response.status_code)
        self.assertIsNone(self.signed_in_email())

    def test_the_login_page_stays_reachable_with_a_ticket_from_elsewhere(self):
        """
        The cookie sits on the domain every deployment shares, so a browser carries
        one minted elsewhere to us as readily as our own. Answering 401 would wedge
        every page, this one included.
        """
        user = self.factory.create_user()
        elsewhere = a_signing_key("elsewhere")
        self.client.set_cookie(self.cookie_name, self.a_ticket(user.email, key=elsewhere))

        response = self.client.get("/{}/login".format(self.factory.org.slug))

        self.assertEqual(200, response.status_code)


class TestArrivingOverSomebodyElse(HandOffTestCase):
    """
    Arriving while somebody else is signed in has to displace them completely.

    Logging in over the top replaces the session and nothing else, and that was not
    enough: on staging the previous visitor came back on the very next request, every
    time, until they were signed out by hand. The remember cookie is the part
    login_user leaves alone -- it only touches it when asked to remember somebody --
    and Flask-Login rewrites the session from it, unconditionally, the moment the
    session's own user fails to load for any reason.
    """

    def remember_cookie_headers(self, response):
        return [
            header
            for header in response.headers.getlist("Set-Cookie")
            if header.startswith("remember_token=")
        ]

    def test_provisioning_leaves_a_remember_cookie_behind(self):
        """The precondition. If this stops holding, the test below proves nothing."""
        response = self.spend(self.a_ticket("first@example.com"))

        remembered = self.remember_cookie_headers(response)
        self.assertEqual(1, len(remembered))
        self.assertNotIn("Expires=Thu, 01 Jan 1970", remembered[0])

    def test_it_takes_the_previous_visitors_credentials_with_them(self):
        self.spend(self.a_ticket("first@example.com"))
        self.client.delete_cookie(self.cookie_name)
        arriving = self.factory.create_user(email="second@example.com")

        response = self.spend(self.a_ticket(arriving.email))

        cleared = self.remember_cookie_headers(response)
        self.assertEqual(1, len(cleared), "the previous visitor was left remembered")
        self.assertIn("Expires=Thu, 01 Jan 1970", cleared[0])
        self.assertEqual(arriving.email, self.signed_in_email())

    def test_it_leaves_its_own_arrival_alone(self):
        """Spending a ticket for whoever is already here must not sign them out."""
        user = self.factory.create_user()
        self.spend(self.a_ticket(user.email))
        self.client.delete_cookie(self.cookie_name)

        response = self.spend(self.a_ticket(user.email))

        self.assertEqual([], self.remember_cookie_headers(response))
        self.assertEqual(user.email, self.signed_in_email())


class TestKeysPerOrganization(HandOffTestCase):
    def test_each_organization_names_its_own_keys(self):
        self.configure(SSO_CALLBACK_JWKS_URL="file:///tmp/metr_sso_{org_slug}.pem")
        alpha = self.factory.create_org(slug="alpha")
        alpha_key = a_signing_key("alpha")
        user = self.factory.create_user(org=alpha)

        self.spend(self.a_ticket(user.email, tenant="alpha", key=alpha_key), org=alpha)

        self.assertEqual(user.email, self.signed_in_email(org=alpha))

    def test_a_ticket_signed_for_one_organization_is_refused_at_another(self):
        self.configure(SSO_CALLBACK_JWKS_URL="file:///tmp/metr_sso_{org_slug}.pem")
        a_signing_key("alpha")
        beta = self.factory.create_org(slug="beta")
        a_signing_key("beta")
        user = self.factory.create_user(org=beta)

        self.spend(self.a_ticket(user.email, tenant="beta", key=a_signing_key("alpha")), org=beta)

        self.assertIsNone(self.signed_in_email(org=beta))

    def test_a_url_naming_no_organization_is_used_as_it_stands(self):
        user = self.factory.create_user()

        self.spend(self.a_ticket(user.email))

        self.assertEqual(user.email, self.signed_in_email())


class TestProvisioning(HandOffTestCase):
    def test_a_newcomer_lands_in_a_group_of_this_features_own(self):
        self.spend(self.a_ticket("newcomer@example.com"))

        user = models.User.query.filter(models.User.email == "newcomer@example.com").one()
        sso_group = self.factory.org.sso_group
        self.assertIsNotNone(sso_group)
        self.assertEqual([sso_group.id], user.group_ids)

    def test_a_newcomer_stays_out_of_the_default_group(self):
        self.spend(self.a_ticket("newcomer@example.com"))

        user = models.User.query.filter(models.User.email == "newcomer@example.com").one()
        self.assertNotIn(self.factory.org.default_group.id, user.group_ids)

    def test_somebody_already_here_keeps_the_groups_they_have(self):
        user = self.factory.create_user(email="already@example.com")
        original_group_ids = list(user.group_ids)

        self.spend(self.a_ticket(user.email))

        self.assertEqual(original_group_ids, list(user.group_ids))


class TestTheLoginButton(HandOffTestCase):
    def test_the_login_page_offers_our_provider(self):
        response = self.client.get("/{}/login".format(self.factory.org.slug))

        self.assertIn(b"Login with metr", response.data)

    def test_it_sends_the_visitor_to_their_own_tenant(self):
        response = self.client.get("/{}/metr/login".format(self.factory.org.slug))

        self.assertTrue(
            response.headers["Location"].startswith(
                "https://{}.metr.systems/sso/dashboards/".format(self.factory.org.slug)
            )
        )

    def test_the_requested_page_travels_along(self):
        next_path = "/{}/dashboard/overview".format(self.factory.org.slug)

        response = self.client.get(
            "/{}/metr/login?next={}".format(self.factory.org.slug, next_path)
        )

        self.assertIn(next_path, response.headers["Location"])

    def test_it_refuses_a_return_path_leaving_the_dashboards(self):
        response = self.client.get(
            "/{}/metr/login?next=https://evil.example/steal".format(self.factory.org.slug)
        )

        self.assertNotIn("evil.example", response.headers["Location"])


class TestConfiguration(BaseTestCase):
    def configure(self, **settings):
        for name, value in settings.items():
            patched = patch.object(metr_settings, name, value)
            patched.start()
            self.addCleanup(patched.stop)

    def test_a_hand_off_without_a_tenant_claim_is_refused(self):
        self.configure(SSO_LOGIN_URL="https://{org_slug}.metr.systems/sso/dashboards/")
        self.configure(SSO_TENANT_CLAIM="", LEGACY_JWT_LOGIN_URL="")

        with self.assertRaises(MisconfiguredError):
            metr_sso.init_app(Flask(__name__))

    def test_naming_the_tenant_claim_is_accepted(self):
        self.configure(
            SSO_LOGIN_URL="https://{org_slug}.metr.systems/sso/dashboards/",
            SSO_TENANT_CLAIM="tenant",
            LEGACY_JWT_LOGIN_URL="",
        )

        metr_sso.init_app(Flask(__name__))

    def test_an_installation_not_using_the_hand_off_needs_no_configuration(self):
        self.configure(SSO_LOGIN_URL="", SSO_TENANT_CLAIM="", LEGACY_JWT_LOGIN_URL="")

        metr_sso.init_app(Flask(__name__))

    def test_settings_left_on_the_old_names_are_refused(self):
        self.configure(
            SSO_LOGIN_URL="",
            LEGACY_JWT_LOGIN_URL="https://{org_slug}.metr.systems/sso/dashboards/",
        )

        with self.assertRaises(MisconfiguredError) as refused:
            metr_sso.init_app(Flask(__name__))

        self.assertIn("REDASH_METR_SSO_LOGIN_URL", str(refused.exception))


class TestSwitchingAwayFromARememberedUser(HandOffTestCase):
    def test_it_switches_away_from_a_user_who_was_remembered(self):
        """
        Provisioning remembers the user it creates -- create_and_login_user passes
        remember=True -- so the first arrival leaves a remember cookie behind.
        """
        self.spend(self.a_ticket("first@example.com"))
        self.client.delete_cookie(self.cookie_name)
        arriving = self.factory.create_user(email="second@example.com")

        self.spend(self.a_ticket(arriving.email))

        self.assertEqual(arriving.email, self.signed_in_email())
