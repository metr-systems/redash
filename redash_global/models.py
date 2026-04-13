"""Models for the Redash composed-dashboard management system."""

from flask_login import UserMixin
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy_utils import EmailType
from sqlalchemy_utils.models import generic_repr

from redash.models.base import Column, db, primary_key
from redash.models.mixins import TimestampMixin


@generic_repr("id", "username", "email")
class GlobalAdminUser(UserMixin, TimestampMixin, db.Model):
    """Admin user for the composed-dashboard management system.

    Separate from regular Redash users to maintain isolation between
    admin operations and cross-organisations-specific user management.
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


@generic_repr("id", "name")
class ComposedDashboard(TimestampMixin, db.Model):
    """A composed dashboard managed globally, made up of Redash Dashboard entries."""

    __tablename__ = "composed_dashboards"

    id = primary_key("ComposedDashboard")
    name = Column(db.String(255), nullable=False)
    description = Column(db.Text, nullable=True)
    admin_user_id = Column(
        db.Integer,
        db.ForeignKey("global_admin_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    admin_user = db.relationship("GlobalAdminUser", backref="dashboards")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "admin_user_id": self.admin_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


@generic_repr("id", "composed_dashboard_id", "dashboard_id")
class ComposedDashboardEntry(db.Model):
    """Through table linking a ComposedDashboard to a Redash Dashboard, with ordering."""

    __tablename__ = "composed_dashboard_entries"
    __table_args__ = (
        db.UniqueConstraint("composed_dashboard_id", "dashboard_id", name="uq_composed_dashboard_entry"),
    )

    id = primary_key("ComposedDashboardEntry")
    composed_dashboard_id = Column(
        db.Integer,
        db.ForeignKey("composed_dashboards.id", ondelete="CASCADE"),
        nullable=False,
    )
    dashboard_id = Column(db.Integer, db.ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(db.Integer, nullable=False, default=0)

    composed_dashboard = db.relationship(
        "ComposedDashboard", backref=db.backref("entries", order_by="ComposedDashboardEntry.order_index")
    )

    def to_dict(self):
        return {
            "id": self.id,
            "composed_dashboard_id": self.composed_dashboard_id,
            "dashboard_id": self.dashboard_id,
            "order_index": self.order_index,
        }


@generic_repr("id", "composed_dashboard_id", "organization_id")
class ComposedDashboardAssignment(TimestampMixin, db.Model):
    """Assignment of a ComposedDashboard to a client organization."""

    __tablename__ = "composed_dashboard_assignments"
    __table_args__ = (
        db.UniqueConstraint("composed_dashboard_id", "organization_id", name="uq_composed_dashboard_assignment"),
    )

    id = primary_key("ComposedDashboardAssignment")
    composed_dashboard_id = Column(
        db.Integer,
        db.ForeignKey("composed_dashboards.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_id = Column(db.Integer, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    composed_dashboard = db.relationship(
        "ComposedDashboard", backref=db.backref("assignments", cascade="all, delete-orphan")
    )

    def to_dict(self):
        return {
            "id": self.id,
            "composed_dashboard_id": self.composed_dashboard_id,
            "organization_id": self.organization_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


@generic_repr("id", "dashboard_id", "organization_id")
class SubDashboardAssignment(TimestampMixin, db.Model):
    """Assignment of a sub-dashboard (template dashboard) to a client organization."""

    __tablename__ = "sub_dashboard_assignments"
    __table_args__ = (db.UniqueConstraint("dashboard_id", "organization_id", name="uq_sub_dashboard_assignment"),)

    id = primary_key("SubDashboardAssignment")
    dashboard_id = Column(db.Integer, db.ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(db.Integer, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "dashboard_id": self.dashboard_id,
            "organization_id": self.organization_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
