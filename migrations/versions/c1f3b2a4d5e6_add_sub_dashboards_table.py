"""add sub_dashboards table for org-independent template dashboards

Revision ID: c1f3b2a4d5e6
Revises: 590b62d263a8
Create Date: 2026-04-09 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c1f3b2a4d5e6'
down_revision = '590b62d263a8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sub_dashboards',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('slug', sa.String(length=140), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('admin_user_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['admin_user_id'], ['global_admin_users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_sub_dashboards_slug', 'sub_dashboards', ['slug'])
    op.create_index('ix_sub_dashboards_is_archived', 'sub_dashboards', ['is_archived'])
    op.create_unique_constraint('uq_sub_dashboards_slug', 'sub_dashboards', ['slug'])

    # Add FK from composed_dashboard_entries.dashboard_id to sub_dashboards.id
    op.create_foreign_key(
        'fk_composed_dashboard_entries_dashboard_id',
        'composed_dashboard_entries',
        'sub_dashboards',
        ['dashboard_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade():
    op.drop_constraint('fk_composed_dashboard_entries_dashboard_id', 'composed_dashboard_entries', type_='foreignkey')
    op.drop_constraint('uq_sub_dashboards_slug', 'sub_dashboards', type_='unique')
    op.drop_index('ix_sub_dashboards_is_archived', table_name='sub_dashboards')
    op.drop_index('ix_sub_dashboards_slug', table_name='sub_dashboards')
    op.drop_table('sub_dashboards')
