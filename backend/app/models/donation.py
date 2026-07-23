import uuid
from sqlalchemy import (
    Boolean, CheckConstraint, Column, DateTime, Enum as PgEnum,
    Float, ForeignKey, Index, Integer, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin
from app.models.enums import DonationStatus, ItemCategory, ItemCondition


class Donation(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "donations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donor_profiles.id", ondelete="RESTRICT"), nullable=False)
    status = Column(PgEnum(DonationStatus, name="donation_status", create_type=False,), default=DonationStatus.draft, nullable=False)
    notes = Column(Text, nullable=True)
    total_items = Column(Integer, default=0, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    donor = relationship("DonorProfile", back_populates="donations")
    items = relationship("DonationItem", back_populates="donation", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="donation")
    pickup = relationship("PickupRequest", back_populates="donation", uselist=False)

    __table_args__ = (
        Index("ix_donations_donor_id", "donor_id"),
        Index("ix_donations_status", "status"),
        Index("ix_donations_donor_status", "donor_id", "status"),
        CheckConstraint("total_items >= 0", name="ck_donations_total_items_gte_0"),
    )


class DonationItem(Base, TimestampMixin):
    __tablename__ = "donation_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(PgEnum(ItemCategory, name="item_category", create_type=False), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    condition = Column(PgEnum(ItemCondition, name="item_condition", create_type=False), nullable=False, default=ItemCondition.good)
    ai_detected = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Float, nullable=True)
    image_path = Column(String(500), nullable=True)
    is_confirmed = Column(Boolean, default=True, nullable=False)

    donation = relationship("Donation", back_populates="items")

    __table_args__ = (
        Index("ix_donation_items_donation_id", "donation_id"),
        Index("ix_donation_items_category", "category"),
        CheckConstraint("quantity > 0", name="ck_donation_items_qty_positive"),
        CheckConstraint(
            "confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)",
            name="ck_donation_items_confidence_range",
        ),
    )
