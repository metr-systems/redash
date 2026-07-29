import pytest

from redash_global import settings as global_settings
from redash_global.app import create_global_app


def test_refuses_to_start_without_global_secret_key(monkeypatch):
    monkeypatch.delenv("GLOBAL_SECRET_KEY", raising=False)

    with pytest.raises(Exception, match="GLOBAL_SECRET_KEY"):
        create_global_app()


@pytest.mark.parametrize("slug", [None, ""])
def test_refuses_to_start_without_template_org_slug(monkeypatch, slug):
    # settings.py reads the environment at import time, so patch the module
    # attribute rather than the environment variable.
    monkeypatch.setattr(global_settings, "TEMPLATE_ORG_SLUG", slug)

    with pytest.raises(Exception, match="TEMPLATE_ORG_SLUG"):
        create_global_app()
