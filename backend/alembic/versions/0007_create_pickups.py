"""create pickup_requests

Revision ID: 0007
Revises: 0006
Create Date: 2024-01-01 00:06:00.000000
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pickup_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donation_id", UUID(as_uuid=True), sa.ForeignKey("donations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("ngo_id", UUID(as_uuid=True), sa.ForeignKey("ngo_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("match_id", UUID(as_uuid=True), sa.ForeignKey("matches.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.Enum("scheduled","in_transit","completed","failed","cancelled",
                                    name="pickup_status", create_type=False),
                  nullable=False, server_default="scheduled"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("pickup_address", sa.String(500), nullable=False),
        sa.Column("pickup_city", sa.String(100), nullable=False),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("donation_id", name="uq_pickup_donation_id"),
        sa.UniqueConstraint("match_id", name="uq_pickup_match_id"),
    )
    op.create_index("ix_pickup_requests_donation_id", "pickup_requests", ["donation_id"])
    op.create_index("ix_pickup_requests_ngo_id", "pickup_requests", ["ngo_id"])
    op.create_index("ix_pickup_requests_match_id", "pickup_requests", ["match_id"])
    op.create_index("ix_pickup_requests_status", "pickup_requests", ["status"])
    op.create_index("ix_pickup_requests_scheduled_at", "pickup_requests", ["scheduled_at"])
    op.create_index("ix_pickup_requests_ngo_scheduled", "pickup_requests", ["ngo_id", "scheduled_at"],
        postgresql_where=sa.text("status = 'scheduled'"))


def downgrade() -> None:
    op.drop_table("pickup_requests")
