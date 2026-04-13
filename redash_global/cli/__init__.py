import click
from flask.cli import with_appcontext

TEMPLATE_ORG_SLUG = "_template"


@click.command("create_global_admin")
@click.argument("username")
@click.argument("email")
@click.argument("password")
@with_appcontext
def create_global_admin(username, email, password):
    """Create a global admin user."""
    from redash.models.base import db
    from redash_global.models import GlobalAdminUser

    user = GlobalAdminUser(username=username, email=email)
    user.hash_password(password)
    db.session.add(user)
    db.session.commit()
    click.echo(f"Admin user '{username}' created.")


@click.command("update_global_admin_password")
@click.argument("username")
@click.password_option(prompt="New password", confirmation_prompt="Confirm new password")
@with_appcontext
def update_global_admin_password(username, password):
    """Update the password of an existing global admin user."""
    from redash.models.base import db
    from redash_global.models import GlobalAdminUser

    user = GlobalAdminUser.get_by_username(username)
    if not user:
        raise click.ClickException(f"No global admin user found with username '{username}'.")

    user.hash_password(password)
    db.session.commit()
    click.echo(f"Password updated for '{username}'.")


@click.command("setup_template_org")
@click.option("--admin-email", required=True, help="Email for the system user in the template org.")
@click.option("--admin-name", default="Template Admin", show_default=True)
@click.option("--admin-password", required=True, help="Password for the system user.")
@with_appcontext
def setup_template_org(admin_email, admin_name, admin_password):
    """Create the _template Organization used for sub-dashboards.

    This is a one-time setup step. The _template org is never visible to
    customers — it exists solely to host sub-dashboards and their queries.
    """
    from redash import models
    from redash.models.base import db
    from redash.models.users import Group

    org = models.Organization.get_by_slug(TEMPLATE_ORG_SLUG)
    if org:
        click.echo(f"Template org '{TEMPLATE_ORG_SLUG}' already exists (id={org.id}).")
    else:
        org = models.Organization(name="Template", slug=TEMPLATE_ORG_SLUG, settings={})
        db.session.add(org)
        db.session.flush()

        default_group = Group(
            org=org,
            type=Group.BUILTIN_GROUP,
            name="default",
            permissions=Group.DEFAULT_PERMISSIONS,
        )
        admin_group = Group(
            org=org,
            type=Group.BUILTIN_GROUP,
            name="admin",
            permissions=Group.DEFAULT_PERMISSIONS + Group.ADMIN_PERMISSIONS,
        )
        db.session.add(default_group)
        db.session.add(admin_group)
        db.session.flush()
        click.echo(f"Created template org '{TEMPLATE_ORG_SLUG}' (id={org.id}).")

    existing = models.User.query.filter(models.User.org == org, models.User.email == admin_email.lower()).first()
    if existing:
        click.echo(f"System user '{admin_email}' already exists in template org.")
    else:
        admin_group = Group.query.filter(
            Group.org == org, Group.name == "admin", Group.type == Group.BUILTIN_GROUP
        ).first()
        default_group = Group.query.filter(
            Group.org == org, Group.name == "default", Group.type == Group.BUILTIN_GROUP
        ).first()
        user = models.User(
            org=org,
            email=admin_email,
            name=admin_name,
            group_ids=[g.id for g in [admin_group, default_group] if g],
        )
        user.hash_password(admin_password)
        db.session.add(user)
        click.echo(f"Created system user '{admin_email}' in template org.")

    db.session.commit()
    click.echo("Done. Sub-dashboards should be created in the '_template' org via the Redash UI.")
