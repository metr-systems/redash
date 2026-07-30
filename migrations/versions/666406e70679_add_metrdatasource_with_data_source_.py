"""add MetrDataSource with data_source_identifier

Revision ID: 666406e70679
Revises: 0cf0ec9c5d17
Create Date: 2026-07-30 15:59:18.645688

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '666406e70679'
down_revision = '0cf0ec9c5d17'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('metr_data_source',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('data_source_id', sa.Integer(), nullable=False),
    sa.Column('org_id', sa.Integer(), nullable=False),
    sa.Column('data_source_identifier', sa.String(length=100), nullable=True),
    sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_metr_data_source_org_id'), 'metr_data_source', ['org_id'], unique=False)
    op.create_index(op.f('ix_metr_data_source_data_source_id'), 'metr_data_source', ['data_source_id'], unique=True)
    op.create_index('uq_metr_data_source_org_data_source_identifier', 'metr_data_source', ['org_id', 'data_source_identifier'], unique=True, postgresql_where=sa.text('data_source_identifier IS NOT NULL'))


def downgrade():
    op.drop_index('uq_metr_data_source_org_data_source_identifier', table_name='metr_data_source', postgresql_where=sa.text('data_source_identifier IS NOT NULL'))
    op.drop_index(op.f('ix_metr_data_source_data_source_id'), table_name='metr_data_source')
    op.drop_index(op.f('ix_metr_data_source_org_id'), table_name='metr_data_source')
    op.drop_table('metr_data_source')
