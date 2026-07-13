import uuid
from sqlalchemy import Column, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class DonorProfile(Base, TimestampMixin):
    __tablename__ = "donor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    user = relationship("User", back_populates="donor_profile")
    donations = relationship("Donation", back_populates="donor", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_donor_profiles_user_id", "user_id"),
        Index("ix_donor_profiles_city", "city"),
    )
