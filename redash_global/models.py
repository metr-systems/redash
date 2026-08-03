from flask_login import UserMixin
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy_utils.models import generic_repr

from redash.models.base import Column, db, primary_key
from redash.models.mixins import TimestampMixin


@generic_repr("id", "username")
class GlobalAdminUser(UserMixin, TimestampMixin, db.Model):
    __tablename__ = "global_admin_users"

    id = primary_key("GlobalAdminUser")
    username = Column(db.String(255), unique=True, nullable=False)
    password_hash = Column(db.String(128), nullable=False)

    def hash_password(self, password):
        """Hash and store the given password using passlib."""
        self.password_hash = pwd_context.hash(password)

    def verify_password(self, password):
        """Verify a password against the stored hash."""
        return self.password_hash and pwd_context.verify(password, self.password_hash)

    @classmethod
    def get_by_username(cls, username):
        """Return the user with the given username, or None."""
        return cls.query.filter(cls.username == username).first()


@generic_repr("id", "dashboard_id", "organization_id")
class SubDashboardAssignment(TimestampMixin, db.Model):
    __tablename__ = "sub_dashboard_assignments"
    __table_args__ = (db.UniqueConstraint("dashboard_id", "organization_id", name="uq_sub_dashboard_assignment"),)

    id = primary_key("SubDashboardAssignment")
    dashboard_id = Column(db.Integer, db.ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(db.Integer, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
