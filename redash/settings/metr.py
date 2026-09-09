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


class MisconfiguredError(Exception):
    """Raised when these settings cannot describe a safe deployment."""


def check_jwt_login_configuration(jwt_login_enabled):
    """
    Refuse to start a deployment that accepts tokens without checking who they are for.

    The tenant claim is the only thing binding a token to one organization. The signature
    says the token came from us, the audience says it was meant for the dashboards, and
    neither says which client it was issued for -- one key serves every organization, which
    is what keeps a new client from needing configuration of its own. Without the claim,
    a token minted for one organization is accepted at every other organization's URL, and
    just-in-time provisioning turns that into an account there rather than a failed lookup.

    The check reads the claim name rather than the request loader's behaviour because the
    loader skips the comparison when the name is empty, so an unset name disables the
    isolation silently: no error, no log line, nothing to notice until someone tries it.
    An installation that does not use JWT login needs none of this, so the check applies
    only when it is switched on.
    """
    if jwt_login_enabled and not JWT_AUTH_TENANT_CLAIM:
        raise MisconfiguredError(
            "REDASH_JWT_LOGIN_ENABLED is set but REDASH_JWT_AUTH_TENANT_CLAIM is not. "
            "A token issued for one organization would be accepted at every other one. "
            "Set REDASH_JWT_AUTH_TENANT_CLAIM to the claim naming the tenant, e.g. 'tenant'."
        )
