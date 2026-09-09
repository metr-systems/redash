# Design Record: METR Settings Live Outside The Organization Settings Dict

## Context

METR-specific configuration needs a home. The obvious one is
`redash/settings/organization.py`, which holds a `settings` dict that
`Organization.get_setting` falls back to and the organization settings API
exposes. Our single sign-on configuration was added there first.

---

## Decision

Deployment-wide METR configuration lives in `redash/settings/metr.py` as plain
module constants. It is imported directly where it is used, not registered in
`redash/settings/__init__.py`.

---

## Why Not The Organization Settings Dict

**It conflicts on every upstream merge.** Upstream appends new entries to that
same dict as it adds features — three commits in the two years to September
2026, for number formatting, NULL value display and beacon reporting. Two sides
appending to the end of one block conflicts every time. A new file cannot
conflict at all.

**It misrepresents what the values are.** Entries in that dict can be
overridden per organization through the settings API. The JWT request loader
reads process-wide values, so a per-organization override would be accepted by
the API and then ignored by the code. Keeping these values in a module makes
"one configuration for every organization" visible rather than something a
reader has to know.

---

## Why Not Registered In `redash/settings/__init__.py`

That file had five upstream commits in the same two years. Importing the module
from there would move the conflict rather than remove it. Each use site imports
`redash.settings.metr` directly instead.

---

## Consequence For Tests

A module constant is read at import time, so a test cannot change it by
mutating a dict. Tests that depend on one of these values patch the module
attribute, and any test class whose behaviour depends on a value being unset
must say so:

```python
no_tenant_claim = patch.object(metr_settings, "JWT_AUTH_TENANT_CLAIM", "")
no_tenant_claim.start()
self.addCleanup(no_tenant_claim.stop)
```

Without that, whatever the developer or CI happens to have in the environment
decides the outcome. This is not hypothetical: it silently refused every token
in the JWT suite the first time, because the local deployment set the claim and
the tests had no opinion about it.

---

## Validated At Startup

One of these values carries a security property, so the module also refuses a
deployment that leaves it unset. `JWT_AUTH_TENANT_CLAIM` names the claim that
binds a token to one organization; the request loader skips the comparison when
the name is empty, so an unset name removes cross-organization isolation with
no error and no log line. `check_jwt_login_configuration` raises
`MisconfiguredError` from `authentication.init_app` when JWT login is on and
the claim is not named, so the process dies at startup instead of serving
traffic with no isolation.

Validation belongs here rather than at each use site because the value is
deployment-wide: there is one correct answer for the whole process, and it can
be checked once before any request arrives. A setting that has to vary per
organization could not be checked this way, which is a further reason to keep
that kind of value out of this module.

---

## Trade-off Accepted

These values can no longer be set per organization. That is correct for
configuration whose whole purpose is to be identical everywhere, but a value
that later needs to vary per organization belongs back in the organization
settings dict, with the conflict cost that implies.
