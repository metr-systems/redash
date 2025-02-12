"""add view_only field to DashboardGroup

Revision ID: 078f3c73f760
Revises: 30448110daa1
Create Date: 2025-02-12 15:49:26.253076

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '078f3c73f760'
down_revision = '30448110daa1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('dashboard_groups', sa.Column('view_only', sa.Boolean(), nullable=False))


def downgrade():
    op.drop_column('dashboard_groups', 'view_only')
