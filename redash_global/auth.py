"""Authentication module for Redash Global service."""

import os
from functools import wraps

from flask import jsonify, request


def require_global_token(f):
    """Decorator to require global API token authentication.

    Checks for X-Global-Api-Token header and validates against
    REDASH_GLOBAL_API_TOKEN environment variable.

    Returns 403 if token is missing or invalid.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Token existence is guaranteed before app creation
        expected_token = os.environ["REDASH_GLOBAL_API_TOKEN"]

        provided_token = request.headers.get("X-Global-Api-Token")

        if not provided_token:
            return jsonify({"error": "Missing X-Global-Api-Token header"}), 401

        if provided_token != expected_token:
            return jsonify({"error": "Invalid global API token"}), 403

        return f(*args, **kwargs)

    return decorated_function
