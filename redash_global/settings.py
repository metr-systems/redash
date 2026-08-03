import os

# Slug of the organization holding the sub-dashboard templates. Required —
# redash_global.app refuses to start without it.
TEMPLATE_ORG_SLUG = os.environ.get("TEMPLATE_ORG_SLUG")
