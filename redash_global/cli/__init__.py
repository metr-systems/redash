import click
from flask.cli import with_appcontext


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
