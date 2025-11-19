"""revert last upstream migrations

Revision ID: 2280e66fca00
Revises: 6bb0a03bc598
Create Date: 2025-11-20 12:08:45.663730

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2280e66fca00'
down_revision = '6bb0a03bc598'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
    UPDATE widgets
    SET options = jsonb_set(
        options,
        '{position,col}',
        to_json(((options->'position'->>'col')::int / 2))::jsonb
    );
    UPDATE widgets
    SET options = jsonb_set(
        options,
        '{position,sizeX}',
        to_json(((options->'position'->>'sizeX')::int / 2))::jsonb
    );
    """)

def downgrade():
    op.execute("""
    UPDATE widgets
    SET options = jsonb_set(
        options,
        '{position,col}',
        to_json(((options->'position'->>'col')::int * 2))::jsonb
    );
    UPDATE widgets
    SET options = jsonb_set(
        options,
        '{position,sizeX}',
        to_json(((options->'position'->>'sizeX')::int * 2))::jsonb
    );
    """)
