"""add last_deployed_at to composed_dashboard_assignments

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-13 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'composed_dashboard_assignments',
        sa.Column('last_deployed_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column('composed_dashboard_assignments', 'last_deployed_at')
