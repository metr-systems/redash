"""add_composed_dashboard_assignments

Revision ID: a1b2c3d4e5f6
Revises: 590b62d263a8
Create Date: 2026-04-12 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c1f3b2a4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'composed_dashboard_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('composed_dashboard_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['composed_dashboard_id'],
            ['composed_dashboards.id'],
            name='composed_dashboard_assignments_composed_dashboard_id_fkey',
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['organization_id'],
            ['organizations.id'],
            name='composed_dashboard_assignments_organization_id_fkey',
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('composed_dashboard_id', 'organization_id', name='uq_composed_dashboard_assignment'),
    )


def downgrade():
    op.drop_table('composed_dashboard_assignments')
