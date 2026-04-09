"""rename_global_dashboard_id_to_composed_dashboard_id

Revision ID: 590b62d263a8
Revises: 398d4c5aee2e
Create Date: 2026-04-09 17:30:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '590b62d263a8'
down_revision = '398d4c5aee2e'
branch_labels = None
depends_on = None


def upgrade():
    # Drop FK referencing old column name
    op.drop_constraint(
        'composed_dashboard_entries_global_dashboard_id_fkey',
        'composed_dashboard_entries',
        type_='foreignkey',
    )
    # Drop old unique constraint
    op.drop_constraint(
        'uq_global_dashboard_entry',
        'composed_dashboard_entries',
        type_='unique',
    )
    # Rename the column
    op.alter_column('composed_dashboard_entries', 'global_dashboard_id',
                    new_column_name='composed_dashboard_id')
    # Re-create unique constraint with new name
    op.create_unique_constraint(
        'uq_composed_dashboard_entry',
        'composed_dashboard_entries',
        ['composed_dashboard_id', 'dashboard_id'],
    )
    # Re-create FK with new name
    op.create_foreign_key(
        'composed_dashboard_entries_composed_dashboard_id_fkey',
        'composed_dashboard_entries',
        'composed_dashboards',
        ['composed_dashboard_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade():
    op.drop_constraint(
        'composed_dashboard_entries_composed_dashboard_id_fkey',
        'composed_dashboard_entries',
        type_='foreignkey',
    )
    op.drop_constraint(
        'uq_composed_dashboard_entry',
        'composed_dashboard_entries',
        type_='unique',
    )
    op.alter_column('composed_dashboard_entries', 'composed_dashboard_id',
                    new_column_name='global_dashboard_id')
    op.create_unique_constraint(
        'uq_global_dashboard_entry',
        'composed_dashboard_entries',
        ['global_dashboard_id', 'dashboard_id'],
    )
    op.create_foreign_key(
        'composed_dashboard_entries_global_dashboard_id_fkey',
        'composed_dashboard_entries',
        'composed_dashboards',
        ['global_dashboard_id'],
        ['id'],
        ondelete='CASCADE',
    )
