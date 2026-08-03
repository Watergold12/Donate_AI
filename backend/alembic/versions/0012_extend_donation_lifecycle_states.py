"""Extend donation lifecycle states for packaging workflow."""

from alembic import op


revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'packaging_notified'")
    op.execute("ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'acknowledged'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely with plain ALTER TYPE.
    pass
