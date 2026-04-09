"""rename_global_dashboards_to_composed_dashboards

Revision ID: 398d4c5aee2e
Revises: 9dae4cc30e7d
Create Date: 2026-04-09 17:04:13.895102

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '398d4c5aee2e'
down_revision = '9dae4cc30e7d'
branch_labels = None
depends_on = None


def upgrade():
    op.rename_table('global_dashboards', 'composed_dashboards')
    op.drop_constraint(
        'global_dashboard_entries_global_dashboard_id_fkey',
        'global_dashboard_entries',
        type_='foreignkey',
    )
    op.create_foreign_key(
        'composed_dashboard_entries_global_dashboard_id_fkey',
        'global_dashboard_entries',
        'composed_dashboards',
        ['global_dashboard_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.rename_table('global_dashboard_entries', 'composed_dashboard_entries')


def downgrade():
    op.rename_table('composed_dashboard_entries', 'global_dashboard_entries')
    op.drop_constraint(
        'composed_dashboard_entries_global_dashboard_id_fkey',
        'global_dashboard_entries',
        type_='foreignkey',
    )
    op.rename_table('composed_dashboards', 'global_dashboards')
    op.create_foreign_key(
        'global_dashboard_entries_global_dashboard_id_fkey',
        'global_dashboard_entries',
        'global_dashboards',
        ['global_dashboard_id'],
        ['id'],
        ondelete='CASCADE',
    )
