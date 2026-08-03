# Redash Global

Standalone Flask app for cross-organization admin. Separate app with its own session cookie, but shares Redash's PostgreSQL database, models and settings. See [README.md](README.md) for required config (`GLOBAL_SECRET_KEY`, `TEMPLATE_ORG_SLUG`)
and CLI usage.

This file does not include everything yet.


## Tests

The metr style applies here too.

- **pytest, not unittest.** No `unittest.TestCase`, no Redash `BaseTestCase`. Plain test functions; a bare `class TestX:` is fine purely for grouping. Native `assert`, never `self.assertEqual`.
- **Fixtures, not module-level constants.** URLs, payloads, ids and objects belong in `@pytest.fixture`. Shared ones go in `tests/conftest.py`; single-file ones at the top of the test module.
- **Check for an existing fixture first** — `tests/conftest.py` already gives you `redash_app`, `app`, `client`, `admin_client`, `admin`, `create_admin` and `factory`.
- **Build models with the factory, never `db.session.add`.** Redash already has the factory pattern (`tests/factories.py`: a `ModelFactory` per model plus `Factory`'s `create_<model>` methods), so use it here too. `tests/factories.py` holds a `Factory` subclassing Redash's, which is what the `factory` fixture returns — add a `create_<model>` method there for each Redash Global model instead of putting them in Redash's own factories file, which keeps the main suite unaware of this app. `ModelFactory.create` commits, so no follow-up `db.session.commit()`.
- **One `test_<module>.py` per source module** — `test_assignments.py` covers all of `views/assignments.py`. No per-view or per-function test files.
- **`@pytest.mark.parametrize` for data variations** instead of near-identical tests.
- **Descriptive names stating the behavior** (`test_create_duplicate_returns_conflict`), not the function under test.
- **No tests for data migrations.**


## Python patterns

- **f-strings for interpolation**, in tests too — not `"...".format(x)` or `%`. Ruff's `UP032` isn't enabled here and upstream Redash is mixed, so this is convention, not lint-enforced. The one exception is logging: pass lazy args (`logger.info("got %s", x)`) so the string is only built when the record is emitted.
- **Comments earn their place.** No comments restating what the code does; keep the ones that explain *why* a non-obvious choice was made (this module leans on those — see `routes.py`'s catch-all note and `tests/conftest.py`'s signal explanation).
- Black + ruff via pre-commit, line length 119.
