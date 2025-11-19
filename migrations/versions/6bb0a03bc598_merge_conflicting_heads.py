"""merge conflicting heads

Revision ID: 6bb0a03bc598
Revises: db0aca1ebd32, e15d462412db
Create Date: 2025-11-19 14:28:32.978960

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6bb0a03bc598'
down_revision = ('db0aca1ebd32', 'e15d462412db')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
