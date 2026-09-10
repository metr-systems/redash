# Design Record: Our Single Sign-On Is Not Redash's JWT Support

## Context

Redash has JWT authentication, and we wanted single sign-on from core-backend
into the dashboards. Reading the token was the same job in both, so we built
ours by configuring and extending Redash's, sharing its `REDASH_JWT_*` settings
and its request loader.

That turned out to be two different features wearing one name.

---

## What Redash's JWT Support Is For

It arrived in September 2018 (`de0089ceb`, PR #2768) for **identity-aware
proxies**, and the file still cites the two it was written against:

```python
# https://developers.cloudflare.com/access/setting-up-access/validate-jwt-tokens/
# https://cloud.google.com/iap/docs/signed-headers-howto
```

Cloudflare Access and Google IAP sit *in front of* Redash and inject a token on
every request. In that arrangement:

- the proxy authenticates the user, and owns logging out
- Redash cannot be reached except through the proxy, so its login page is moot
- the token is a **continuous assertion**, deliberately standing and refreshed
- password login is normally off, so there is one source of identity

Given all that, a Flask-Login `request_loader` is exactly right: per-request,
stateless, no session of its own. Reporting `401` for a bad token is right too,
because a bad token from your own proxy is a fault worth surfacing.

The original pull request had a blueprint and **removed** it. A proxy has no
moment of hand-off, so there is nothing for a route to receive.

---

## What Ours Is For

core-backend sits *beside* the dashboards, not in front. It mints one token and
redirects. Every assumption above is inverted:

| Redash's JWT assumes | we have |
|---|---|
| a proxy owns logout and keeps re-injecting | one mint, and nothing to revoke it |
| one source of identity | password login on, deliberately, for migration |
| a token from a trusted proxy, always fresh | a cookie that may be stale, rotated, or another deployment's |

Using the one for the other produced four bugs, three of which had no counterpart
in the SAML branch, because a SAML assertion is already a ticket:

1. **Logging out did nothing.** The session was cleared, the cookie was not, and
   the next request presented it again.
2. **A session outranked the hand-off.** Arriving as somebody else left the
   earlier person signed in -- and handed over their identity on logout.
3. **A malformed cookie was a 500 on every page.** The key id is read before any
   key is tried, so it escaped the verification loop.
4. **A cookie from another deployment was a 401 on every page**, the login page
   included. The cookie is scoped to the domain the deployments share.

Three of the four exist only because a standing bearer credential was read on
every request. They are not Redash's bugs; they are what its feature does when
asked to be a different one.

---

## Decision

The hand-off lives in `redash/authentication/metr_sso.py`, a peer of
`saml_auth.py`, `ldap_auth.py` and `google_oauth.py` rather than a change to
`jwt_auth.py`. Redash's JWT support is left switched off and unmodified.

A callback spends the ticket: verify it, log that user in, delete the cookie.
From then on the session is Redash's own, so logging out is Redash's own
business, and the exchange replaces whoever was signed in before rather than
deferring to them. This is, deliberately, the shape `saml_auth.py` already has.

Settings are `REDASH_METR_SSO_*`. `init_app` refuses to start on a deployment
still carrying `REDASH_JWT_LOGIN_URL`, so the rename cannot pass unnoticed.

---

## What We Still Borrow

`jwt_auth.verify_jwt_token` — signature, `aud`, `iss`, `exp` and JWKS fetching.
It is a pure function with no upstream commits in two years, and it is sound: a
hand-crafted `HS256` forgery signed with the public key is refused, as is
`alg: none`, because PyJWT rejects a PEM as an HMAC secret.

One wart comes with it. Its key cache never expires, so rotating a signing key
needs a restart. Writing our own verification against PyJWT would fix that and
check `iss` and `aud` in one `decode` call, at the cost of about 25 lines of
crypto-adjacent code we would own. Not worth it until rotation without a restart
matters.

---

## What This Costs

Renaming nine settings and two routes, which has to happen in the same breath as
the core-backend deploy that redirects to them.

---

## What It Buys

Lines in files upstream owns fall from 163 to 4 -- two wiring `metr_sso.init_app`
and two adding a `group_ids` argument to `create_and_login_user`. Nothing at all
in `redash/handlers/authentication.py`, which upstream touched five times in two
years and which was our only diff in a file with real churn.

The two features also become independent rather than entangled: a deployment
behind Cloudflare Access could switch Redash's JWT support on without touching
ours.
