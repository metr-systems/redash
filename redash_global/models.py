"""Models for Redash Global dashboard management system."""

from passlib.apps import custom_app_context as pwd_context
from sqlalchemy_utils import EmailType
from sqlalchemy_utils.models import generic_repr

from redash.models.base import Column, db, primary_key
from redash.models.mixins import TimestampMixin


@generic_repr("id", "username", "email")
class GlobalAdminUser(TimestampMixin, db.Model):
    """Admin user for global dashboard management system.

    Separate from regular Redash users to maintain isolation between
    global admin operations and cross-organizations-specific user management.
    """

    id = primary_key("GlobalAdminUser")
    username = Column(db.String(255), unique=True, nullable=False)
    email = Column(EmailType, unique=True, nullable=False)
    password_hash = Column(db.String(128), nullable=False)

    __tablename__ = "global_admin_users"

    def __init__(self, **kwargs):
        """Initialize user with lowercase email."""
        if kwargs.get("email") is not None:
            kwargs["email"] = kwargs["email"].lower()
        super(GlobalAdminUser, self).__init__(**kwargs)

    def hash_password(self, password):
        """Hash and store password using passlib."""
        self.password_hash = pwd_context.hash(password)

    def verify_password(self, password):
        """Verify password against stored hash."""
        return self.password_hash and pwd_context.verify(password, self.password_hash)

    @classmethod
    def get_by_username(cls, username):
        """Get user by username."""
        return cls.query.filter(cls.username == username).first()

    @classmethod
    def get_by_email(cls, email):
        """Get user by email."""
        return cls.query.filter(cls.email == email.lower()).first()

    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
