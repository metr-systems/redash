from sys import exit

from click import argument, command, option, prompt

from redash.models import db
from redash_global.models import GlobalAdminUser


@command(name="create_global_admin")
@argument("username")
@option(
    "--password",
    "password",
    default=None,
    help="Password for the admin (leave blank for prompt).",
)
def create_global_admin(username, password=None):
    if GlobalAdminUser.get_by_username(username) is not None:
        print(f"Global admin [{username}] already exists.")
        exit(1)

    if not password:
        password = prompt("Password", hide_input=True, confirmation_prompt=True)

    user = GlobalAdminUser(username=username)
    user.hash_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        print(f"Failed creating global admin: {e}")
        exit(1)

    print(f"Created global admin [{username}].")


@command(name="update_global_admin_password")
@argument("username")
@argument("password")
def update_global_admin_password(username, password):
    user = GlobalAdminUser.get_by_username(username)
    if user is None:
        print(f"Global admin [{username}] not found.")
        exit(1)

    user.hash_password(password)
    db.session.add(user)
    db.session.commit()
    print(f"Updated password for global admin [{username}].")
