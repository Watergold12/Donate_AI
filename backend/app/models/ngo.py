import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class NGOProfile(Base, TimestampMixin):
    __tablename__ = "ngo_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    org_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), nullable=False, unique=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    service_areas = Column(ARRAY(String), nullable=True, default=list)
    verification_doc_path = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="ngo_profile", foreign_keys=[user_id])
    verifier = relationship("User", foreign_keys=[verified_by])
    demands = relationship("NGODemand", back_populates="ngo", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="ngo")
    pickups = relationship("PickupRequest", back_populates="ngo")

    __table_args__ = (
        Index("ix_ngo_profiles_user_id", "user_id"),
        Index("ix_ngo_profiles_city", "city"),
        Index("ix_ngo_profiles_is_verified", "is_verified"),
        Index("ix_ngo_profiles_service_areas", "service_areas", postgresql_using="gin"),
    )
