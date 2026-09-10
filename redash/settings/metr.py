"""
Settings for METR-specific behaviour.

These are deliberately kept out of redash.settings.organization. That module's
`settings` dict is what upstream appends to, so adding to it conflicts on every
upstream merge. It is also the wrong place semantically: values there can be
overridden per organization through the settings API, and nothing here is read
that way, so such an override would be accepted and then ignored.

Everything here is deployment-wide on purpose. One configuration serves every
organization, including ones created later, with {org_slug} filled in where a
value has to name one.
"""

import os

# Single sign-on from core-backend. Named for what it is rather than for the
# format its credential happens to use: REDASH_JWT_* belongs to Redash's own
# support for identity-aware proxies, which is a different feature entirely.
# See redash.authentication.metr_sso.
SSO_LOGIN_URL = os.environ.get("REDASH_METR_SSO_LOGIN_URL", "")
SSO_CALLBACK_JWKS_URL = os.environ.get("REDASH_METR_SSO_JWKS_URL", "")
SSO_ISSUER = os.environ.get("REDASH_METR_SSO_ISSUER", "")
SSO_AUDIENCE = os.environ.get("REDASH_METR_SSO_AUDIENCE", "")
SSO_ALGORITHMS = os.environ.get("REDASH_METR_SSO_ALGORITHMS", "RS256").split(",")
SSO_COOKIE_NAME = os.environ.get("REDASH_METR_SSO_COOKIE_NAME", "")
SSO_COOKIE_DOMAIN = os.environ.get("REDASH_METR_SSO_COOKIE_DOMAIN", "")
SSO_TENANT_CLAIM = os.environ.get("REDASH_METR_SSO_TENANT_CLAIM", "")

# Only to catch a deployment left on the settings this feature used to borrow.
LEGACY_JWT_LOGIN_URL = os.environ.get("REDASH_JWT_LOGIN_URL", "")
