from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True, scope="session")
def mock_babel_gettext():
    """
    Automatically mock flask_babel._ globally for all tests.
    Returns the string as-is, without performing translations.
    """
    with patch("flask_babel._", side_effect=lambda *args, **kwargs: args[0]):
        yield
