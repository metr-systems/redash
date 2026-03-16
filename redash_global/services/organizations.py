"""Organization service for Redash Global."""

from redash.models import Group, Organization, User, db


class OrganizationValidationError(Exception):
    """Raised when organization creation validation fails."""

    pass


def create_organization_with_admin(name, slug, admin_email, admin_name, password):
    """Create a new organization with admin user and built-in groups.

    Args:
        name (str): Organization name
        slug (str): Organization slug (must be unique)
        admin_email (str): Email for the first admin user
        admin_name (str): Name for the first admin user
        password (str): Password for admin user

    Returns:
        dict: Structure containing organization and admin user info

    Raises:
        OrganizationValidationError: If validation fails
    """
    # Check if organization slug already exists
    existing_org = Organization.query.filter(Organization.slug == slug).first()
    if existing_org:
        raise OrganizationValidationError(f"Organization with slug '{slug}' already exists")

    # Create organization and groups in a single transaction
    try:
        # Create organization
        org = Organization(name=name, slug=slug, settings={})
        db.session.add(org)
        db.session.flush()  # Flush to get the org.id

        # Create admin group
        admin_group = Group(
            name="admin",
            permissions=Group.ADMIN_PERMISSIONS,
            org=org,
            type=Group.BUILTIN_GROUP,
        )

        # Create default group
        default_group = Group(
            name="default",
            permissions=Group.DEFAULT_PERMISSIONS,
            org=org,
            type=Group.BUILTIN_GROUP,
        )

        db.session.add_all([admin_group, default_group])
        db.session.flush()  # Flush to get group IDs

        # Create admin user
        admin_user = User(
            org=org,
            email=admin_email.lower(),
            name=admin_name,
            group_ids=[admin_group.id, default_group.id],
        )

        # Set password
        admin_user.hash_password(password)

        db.session.add(admin_user)
        db.session.flush()  # Flush to get user ID

        # Commit the transaction
        db.session.commit()

        # Prepare response
        result = {
            "organization": {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
            },
            "admin_user": {
                "id": admin_user.id,
                "email": admin_user.email,
                "name": admin_user.name,
            },
        }

        return result

    except Exception:
        db.session.rollback()
        raise
