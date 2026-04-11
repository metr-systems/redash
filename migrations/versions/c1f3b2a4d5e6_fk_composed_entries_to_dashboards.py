"""Add FK from composed_dashboard_entries.dashboard_id to dashboards

Revision ID: c1f3b2a4d5e6
Revises: 590b62d263a8
Create Date: 2026-04-12 10:00:00.000000

Sub-dashboards are regular Redash Dashboard rows living in a dedicated
'_template' Organization (created via `flask setup_template_org`).
"""
from alembic import op

revision = 'c1f3b2a4d5e6'
down_revision = '590b62d263a8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_foreign_key(
        'fk_composed_dashboard_entries_dashboard_id',
        'composed_dashboard_entries',
        'dashboards',
        ['dashboard_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade():
    op.drop_constraint(
        'fk_composed_dashboard_entries_dashboard_id',
        'composed_dashboard_entries',
        type_='foreignkey',
    )
