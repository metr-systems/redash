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

Some of these values carry a security property, and the feature that reads them
refuses to start when one is missing. `SSO_TENANT_CLAIM` names the claim binding
a ticket to one organization; the comparison is skipped when the name is empty,
so an unset name removes cross-organization isolation with no error and no log
line. `metr_sso.init_app` raises `MisconfiguredError` in that case, so the
process dies at startup rather than serving traffic with no isolation.

The check lives with the feature rather than here because it is about how the
values are used together, not about any one of them. What belongs here is that
they are deployment-wide: there is one correct answer for the whole process, so
it can be checked once before any request arrives. A setting that has to vary
per organization could not be checked this way, which is a further reason to
keep that kind of value out of this module.

## Named For The Feature, Not The Format

These are `REDASH_METR_SSO_*`, not `REDASH_JWT_*`. The earlier names were
borrowed from Redash's own JWT support, which is a different feature -- see
[Our Single Sign-On Is Not Redash's JWT Support](metr_sso_not_redash_jwt.md) --
and sharing its names made two unrelated things look like one configured thing.
`metr_sso.init_app` refuses to start on a deployment still carrying the old
names, so the rename cannot fail silently.

---

## Trade-off Accepted

These values can no longer be set per organization. That is correct for
configuration whose whole purpose is to be identical everywhere, but a value
that later needs to vary per organization belongs back in the organization
settings dict, with the conflict cost that implies.
