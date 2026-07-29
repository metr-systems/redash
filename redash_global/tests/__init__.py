import os

# Redash Global refuses to start without these two. Settings modules read the
# environment at import time, so they have to be set before anything imports
# redash_global.settings.
os.environ["GLOBAL_SECRET_KEY"] = "test-global-secret"
os.environ["TEMPLATE_ORG_SLUG"] = "se_template"

# The main suite's package module sets up the shared Redash test environment
# (test Redis databases, multi-org mode, CSRF off) and must run before
# redash.settings is imported. Redash Global runs against the main Redash
# database, so its tests need the same environment.
import tests  # noqa: E402,F401
