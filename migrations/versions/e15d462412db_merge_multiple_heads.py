"""Merge multiple heads

Revision ID: e15d462412db
Revises: 772f7bdf8b98, 9e8c841d1a30
Create Date: 2025-03-21 13:08:27.830925

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e15d462412db'
down_revision = ('772f7bdf8b98', '9e8c841d1a30')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
