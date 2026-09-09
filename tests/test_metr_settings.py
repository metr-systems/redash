from unittest.mock import patch

import pytest
from flask import Flask

from redash import authentication
from redash.settings import metr as metr_settings
from redash.settings.metr import MisconfiguredError, check_jwt_login_configuration
from redash.settings.organization import settings as org_settings


class TestCheckJwtLoginConfiguration:
    @patch.object(metr_settings, "JWT_AUTH_TENANT_CLAIM", "")
    def test_accepting_tokens_without_naming_the_tenant_claim_is_refused(self):
        with pytest.raises(MisconfiguredError, match="REDASH_JWT_AUTH_TENANT_CLAIM"):
            check_jwt_login_configuration(jwt_login_enabled=True)

    @patch.object(metr_settings, "JWT_AUTH_TENANT_CLAIM", "tenant")
    def test_naming_the_tenant_claim_is_accepted(self):
        check_jwt_login_configuration(jwt_login_enabled=True)

    @patch.object(metr_settings, "JWT_AUTH_TENANT_CLAIM", "")
    def test_an_installation_not_using_jwt_login_needs_no_tenant_claim(self):
        check_jwt_login_configuration(jwt_login_enabled=False)


class TestInitApp:
    @patch.object(metr_settings, "JWT_AUTH_TENANT_CLAIM", "")
    def test_the_application_refuses_to_start_without_the_tenant_claim(self):
        with patch.dict(org_settings, {"auth_jwt_login_enabled": True}):
            with pytest.raises(MisconfiguredError):
                authentication.init_app(Flask(__name__))
