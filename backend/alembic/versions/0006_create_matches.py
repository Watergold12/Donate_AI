"""create matches

Revision ID: 0006
Revises: 0005
Create Date: 2024-01-01 00:05:00.000000
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "matches",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donation_id", UUID(as_uuid=True), sa.ForeignKey("donations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("ngo_demand_id", UUID(as_uuid=True), sa.ForeignKey("ngo_demands.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ngo_id", UUID(as_uuid=True), sa.ForeignKey("ngo_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("status", sa.Enum("proposed","accepted","rejected","expired","completed",
                                    name="match_status", create_type=False),
                  nullable=False, server_default="proposed"),
        sa.Column("proposed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("score >= 0.0 AND score <= 1.0", name="ck_matches_score_range"),
    )
    op.create_index("ix_matches_donation_id", "matches", ["donation_id"])
    op.create_index("ix_matches_ngo_id", "matches", ["ngo_id"])
    op.create_index("ix_matches_ngo_demand_id", "matches", ["ngo_demand_id"])
    op.create_index("ix_matches_status", "matches", ["status"])
    op.create_index("ix_matches_ngo_status", "matches", ["ngo_id", "status"])
    op.create_index("ix_matches_donation_status", "matches", ["donation_id", "status"])


def downgrade() -> None:
    op.drop_table("matches")
