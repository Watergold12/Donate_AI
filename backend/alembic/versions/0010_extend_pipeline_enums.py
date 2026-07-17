"""Extend enums for full donation pipeline

Revision ID: 0010
Revises: 0009
Create Date: 2024-01-01 00:09:00.000000
"""
from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new DonationStatus values (IF NOT EXISTS is safe on PostgreSQL 9.1+)
    for val in ("pending", "detected", "accepted", "pickup_scheduled", "collected", "delivered"):
        op.execute(f"ALTER TYPE donation_status ADD VALUE IF NOT EXISTS '{val}'")

    # Add new PickupStatus values
    for val in ("confirmed", "collected", "delivered"):
        op.execute(f"ALTER TYPE pickup_status ADD VALUE IF NOT EXISTS '{val}'")


def downgrade() -> None:
    # PostgreSQL cannot remove enum values without recreating the type.
    # Downgrade is intentionally a no-op — values are additive only.
    pass
