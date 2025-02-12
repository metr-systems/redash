"""add DashboardGroup table

Revision ID: 30448110daa1
Revises: 6f3ff3d0dd48
Create Date: 2025-02-12 12:25:46.429308

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '30448110daa1'
down_revision = '6f3ff3d0dd48'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('dashboard_groups',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('dashboard_id', sa.Integer(), nullable=True),
    sa.Column('group_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['dashboard_id'], ['dashboards.id'], ),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('dashboard_groups')
