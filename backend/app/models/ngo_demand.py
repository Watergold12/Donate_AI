import uuid
from sqlalchemy import (
    Boolean, CheckConstraint, Column, DateTime,
    Enum as PgEnum, ForeignKey, Index, Integer, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from app.models.enums import DemandUrgency, ItemCategory


class NGODemand(Base, TimestampMixin):
    __tablename__ = "ngo_demands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False)
    item_category = Column(PgEnum(ItemCategory, name="item_category", create_type=False), nullable=False)
    item_name = Column(String(255), nullable=True)
    quantity_needed = Column(Integer, nullable=False)
    quantity_fulfilled = Column(Integer, default=0, nullable=False)
    urgency_level = Column(PgEnum(DemandUrgency, name="demand_urgency", create_type=False), nullable=False, default=DemandUrgency.medium)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    ngo = relationship("NGOProfile", back_populates="demands")
    matches = relationship("Match", back_populates="ngo_demand")

    __table_args__ = (
        Index("ix_ngo_demands_ngo_id", "ngo_id"),
        Index("ix_ngo_demands_category", "item_category"),
        Index("ix_ngo_demands_urgency", "urgency_level"),
        Index("ix_ngo_demands_active_category", "item_category", "is_active", postgresql_where="is_active = true"),
        CheckConstraint("quantity_needed > 0", name="ck_ngo_demands_qty_needed_positive"),
        CheckConstraint("quantity_fulfilled >= 0", name="ck_ngo_demands_qty_fulfilled_gte_0"),
        CheckConstraint("quantity_fulfilled <= quantity_needed", name="ck_ngo_demands_fulfilled_lte_needed"),
    )
