"""create donations and donation_items

Revision ID: 0004
Revises: 0003
Create Date: 2024-01-01 00:03:00.000000
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM as PgEnum
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "donations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donor_id", UUID(as_uuid=True), sa.ForeignKey("donor_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", PgEnum("draft","pending_match","matched","scheduled","completed","cancelled",
                                    name="donation_status", create_type=False), nullable=False, server_default="draft"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("total_items", sa.Integer, nullable=False, server_default="0"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("total_items >= 0", name="ck_donations_total_items_gte_0"),
    )
    op.create_index("ix_donations_donor_id", "donations", ["donor_id"])
    op.create_index("ix_donations_status", "donations", ["status"])
    op.create_index("ix_donations_donor_status", "donations", ["donor_id", "status"])

    op.create_table(
        "donation_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donation_id", UUID(as_uuid=True), sa.ForeignKey("donations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("item_name", sa.String(255), nullable=False),
        sa.Column("category", PgEnum("clothing","food","electronics","furniture","books","medical","toys","other",
                                      name="item_category", create_type=False), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("condition", PgEnum("new","good","fair","poor", name="item_condition", create_type=False),
                  nullable=False, server_default="good"),
        sa.Column("ai_detected", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column("image_path", sa.String(500), nullable=True),
        sa.Column("is_confirmed", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("quantity > 0", name="ck_donation_items_qty_positive"),
        sa.CheckConstraint(
            "confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)",
            name="ck_donation_items_confidence_range"),
    )
    op.create_index("ix_donation_items_donation_id", "donation_items", ["donation_id"])
    op.create_index("ix_donation_items_category", "donation_items", ["category"])


def downgrade() -> None:
    op.drop_table("donation_items")
    op.drop_table("donations")
