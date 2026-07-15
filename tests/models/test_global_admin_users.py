from sqlalchemy.exc import IntegrityError

from redash.models import db
from redash_global.models import GlobalAdminUser
from tests import BaseTestCase


class GlobalAdminUserTest(BaseTestCase):
    def _create_user(self, username="admin", password="secret"):
        user = GlobalAdminUser(username=username)
        user.hash_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    def test_hash_and_verify_password(self):
        """Password is stored hashed and verifies against the original."""
        user = self._create_user(password="secret")

        self.assertNotEqual(user.password_hash, "secret")
        self.assertTrue(user.verify_password("secret"))
        self.assertFalse(user.verify_password("wrong"))

    def test_get_by_username(self):
        """get_by_username returns the matching user, or None."""
        user = self._create_user(username="admin")

        self.assertEqual(GlobalAdminUser.get_by_username("admin").id, user.id)
        self.assertIsNone(GlobalAdminUser.get_by_username("nobody"))

    def test_username_must_be_unique(self):
        """Duplicate usernames raise an IntegrityError."""
        self._create_user(username="admin")

        dup = GlobalAdminUser(username="admin")
        dup.hash_password("secret")
        db.session.add(dup)

        with self.assertRaises(IntegrityError):
            db.session.flush()
