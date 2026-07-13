"""create ngo_demands

Revision ID: 0005
Revises: 0004
Create Date: 2024-01-01 00:04:00.000000
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM as PgEnum
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ngo_demands",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ngo_id", UUID(as_uuid=True), sa.ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("item_category", PgEnum("clothing","food","electronics","furniture","books","medical","toys","other",
                                           name="item_category", create_type=False), nullable=False),
        sa.Column("item_name", sa.String(255), nullable=True),
        sa.Column("quantity_needed", sa.Integer, nullable=False),
        sa.Column("quantity_fulfilled", sa.Integer, nullable=False, server_default="0"),
        sa.Column("urgency_level", PgEnum("low","medium","high","critical",
                                           name="demand_urgency", create_type=False),
                  nullable=False, server_default="medium"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("quantity_needed > 0", name="ck_ngo_demands_qty_needed_positive"),
        sa.CheckConstraint("quantity_fulfilled >= 0", name="ck_ngo_demands_qty_fulfilled_gte_0"),
        sa.CheckConstraint("quantity_fulfilled <= quantity_needed", name="ck_ngo_demands_fulfilled_lte_needed"),
    )
    op.create_index("ix_ngo_demands_ngo_id", "ngo_demands", ["ngo_id"])
    op.create_index("ix_ngo_demands_category", "ngo_demands", ["item_category"])
    op.create_index("ix_ngo_demands_urgency", "ngo_demands", ["urgency_level"])
    op.create_index("ix_ngo_demands_active_category", "ngo_demands", ["item_category", "is_active"],
        postgresql_where=sa.text("is_active = true"))


def downgrade() -> None:
    op.drop_table("ngo_demands")
