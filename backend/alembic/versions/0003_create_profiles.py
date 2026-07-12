"""create donor and ngo profiles

Revision ID: 0003
Revises: 0002
Create Date: 2024-01-01 00:02:00.000000
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "donor_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("pincode", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", name="uq_donor_profiles_user_id"),
    )
    op.create_index("ix_donor_profiles_user_id", "donor_profiles", ["user_id"])
    op.create_index("ix_donor_profiles_city", "donor_profiles", ["city"])

    op.create_table(
        "ngo_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("org_name", sa.String(255), nullable=False),
        sa.Column("registration_number", sa.String(100), nullable=False),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("pincode", sa.String(20), nullable=True),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("website", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("service_areas", ARRAY(sa.String), nullable=True),
        sa.Column("verification_doc_path", sa.String(500), nullable=True),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("verified_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", name="uq_ngo_profiles_user_id"),
        sa.UniqueConstraint("registration_number", name="uq_ngo_registration_number"),
    )
    op.create_index("ix_ngo_profiles_user_id", "ngo_profiles", ["user_id"])
    op.create_index("ix_ngo_profiles_city", "ngo_profiles", ["city"])
    op.create_index("ix_ngo_profiles_is_verified", "ngo_profiles", ["is_verified"])
    op.execute("CREATE INDEX ix_ngo_profiles_service_areas ON ngo_profiles USING gin(service_areas)")


def downgrade() -> None:
    op.drop_table("ngo_profiles")
    op.drop_table("donor_profiles")
