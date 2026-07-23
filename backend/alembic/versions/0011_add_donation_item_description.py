"""Add description to donation items

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-23 18:55:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("donation_items", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("donation_items", "description")
