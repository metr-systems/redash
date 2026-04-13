"""add_sub_dashboard_assignments

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
    op.create_table(
        'sub_dashboard_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dashboard_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['dashboard_id'],
            ['dashboards.id'],
            name='sub_dashboard_assignments_dashboard_id_fkey',
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['organization_id'],
            ['organizations.id'],
            name='sub_dashboard_assignments_organization_id_fkey',
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('dashboard_id', 'organization_id', name='uq_sub_dashboard_assignment'),
    )


def downgrade():
    op.drop_table('sub_dashboard_assignments')
