import pytest
from sqlalchemy.exc import IntegrityError

from redash.models import db
from redash_global.models import GlobalAdminUser


def test_hash_and_verify_password(create_admin):
    admin = create_admin(password="secret")

    assert admin.password_hash != "secret"
    assert admin.verify_password("secret")
    assert not admin.verify_password("wrong")


def test_get_by_username(create_admin):
    admin = create_admin(username="admin")

    assert GlobalAdminUser.get_by_username("admin").id == admin.id
    assert GlobalAdminUser.get_by_username("nobody") is None


def test_username_must_be_unique(create_admin):
    create_admin(username="admin")

    duplicate = GlobalAdminUser(username="admin")
    duplicate.hash_password("secret")
    db.session.add(duplicate)

    with pytest.raises(IntegrityError):
        db.session.flush()
