import uuid
from sqlalchemy import Column, DateTime, Enum as PgEnum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from app.models.enums import PickupStatus


class PickupRequest(Base, TimestampMixin):
    __tablename__ = "pickup_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="RESTRICT"), nullable=False, unique=True)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("ngo_profiles.id", ondelete="RESTRICT"), nullable=False)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="RESTRICT"), nullable=False, unique=True)
    status = Column(PgEnum(PickupStatus, name="pickup_status", create_type=False), default=PickupStatus.scheduled, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    pickup_address = Column(String(500), nullable=False)
    pickup_city = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    donation = relationship("Donation", back_populates="pickup")
    ngo = relationship("NGOProfile", back_populates="pickups")
    match = relationship("Match", back_populates="pickup")

    __table_args__ = (
        Index("ix_pickup_requests_donation_id", "donation_id"),
        Index("ix_pickup_requests_ngo_id", "ngo_id"),
        Index("ix_pickup_requests_match_id", "match_id"),
        Index("ix_pickup_requests_status", "status"),
        Index("ix_pickup_requests_scheduled_at", "scheduled_at"),
        Index("ix_pickup_requests_ngo_scheduled", "ngo_id", "scheduled_at", postgresql_where="status = 'scheduled'"),
    )
