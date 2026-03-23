"""View functions for Redash Global service."""

from flask import jsonify, request

from redash_global.auth import require_global_token
from redash_global.services.organizations import (
    OrganizationValidationError,
    create_organization_with_admin,
)


@require_global_token
def create_organization_view():
    """Create a new organization with admin user and built-in groups.

    Expected JSON body:
    {
        "name": "Organization Name",
        "slug": "org-slug",
        "admin_email": "admin@example.com",
        "admin_name": "Admin User",
        "password": "password123"
    }

    Returns:
        201: Organization created successfully
        400: Validation error
        500: Server error
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "JSON body is required"}), 400

        # Extract required fields
        required_fields = ["name", "slug", "admin_email", "admin_name", "password"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Create organization
        result = create_organization_with_admin(
            name=data["name"],
            slug=data["slug"],
            admin_email=data["admin_email"],
            admin_name=data["admin_name"],
            password=data["password"],
        )

        return jsonify(result), 201

    except OrganizationValidationError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        import logging

        logging.error(f"Error creating organization: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
