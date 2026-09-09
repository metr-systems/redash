"""
Settings for METR-specific behaviour.

These are deliberately kept out of redash.settings.organization. That module's
`settings` dict is what upstream appends to, so adding to it conflicts on every
upstream merge. It is also the wrong place semantically: values there can be
overridden per organization through the settings API, and the JWT request
loader reads process-wide values, so such an override would be accepted and
then ignored.

Everything here is deployment-wide on purpose. One configuration serves every
organization, including ones created later.
"""

import os

JWT_LOGIN_URL = os.environ.get("REDASH_JWT_LOGIN_URL", "")
JWT_AUTH_TENANT_CLAIM = os.environ.get("REDASH_JWT_AUTH_TENANT_CLAIM", "")
