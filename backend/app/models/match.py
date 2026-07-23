import uuid
from typing import Optional
from sqlalchemy import (
    CheckConstraint, Column, DateTime, Enum as PgEnum,
    Float, ForeignKey, Index, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from app.models.enums import MatchStatus


class Match(Base, TimestampMixin):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="RESTRICT"), nullable=False)
    ngo_demand_id = Column(UUID(as_uuid=True), ForeignKey("ngo_demands.id", ondelete="SET NULL"), nullable=True)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("ngo_profiles.id", ondelete="RESTRICT"), nullable=False)
    score = Column(Float, nullable=False)
    status = Column(PgEnum(MatchStatus, name="match_status", create_type=False), default=MatchStatus.proposed, nullable=False)
    proposed_at = Column(DateTime(timezone=True), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    rejection_reason = Column(Text, nullable=True)

    donation = relationship("Donation", back_populates="matches")
    ngo_demand = relationship("NGODemand", back_populates="matches")
    ngo = relationship("NGOProfile", back_populates="matches")
    pickup = relationship("PickupRequest", back_populates="match", uselist=False)

    def _matching_score(self):
        """
        Compute the derived match score once per instance.

        The result is cached on the ORM instance so response serialization can
        reuse the same semantic embedding result for the score breakdown and
        the human-readable explanation without recomputing embeddings.
        """
        cached = getattr(self, "_matching_score_cache", None)
        if cached is not None:
            return cached

        if not self.donation or not self.ngo_demand or not self.ngo:
            return None

        from app.utils.matching_algorithm import compute_score

        donor_city = self.donation.donor.city if self.donation.donor else None
        donor_state = self.donation.donor.state if self.donation.donor else None
        score = compute_score(
            [item for item in self.donation.items if item.is_confirmed],
            self.ngo_demand,
            self.ngo,
            donor_city=donor_city,
            donor_state=donor_state,
        )
        setattr(self, "_matching_score_cache", score)
        return score

    @property
    def donation_notes(self) -> Optional[str]:
        return self.donation.notes if self.donation else None

    @property
    def items_summary(self) -> Optional[str]:
        if not self.donation or not self.donation.items:
            return None
        return ", ".join(f"{i.quantity}x {i.item_name}" for i in self.donation.items if i.is_confirmed)

    @property
    def demand_item_name(self) -> Optional[str]:
        return self.ngo_demand.item_name if self.ngo_demand else None

    @property
    def score_breakdown(self) -> Optional[dict]:
        score = self._matching_score()
        if score is None:
            return None

        from app.utils.matching_algorithm import build_score_breakdown
        return build_score_breakdown(score)

    @property
    def match_explanation(self) -> Optional[list[str]]:
        score = self._matching_score()
        if score is None:
            return None

        from app.utils.matching_algorithm import build_match_explanation
        return build_match_explanation(score)

    __table_args__ = (
        Index("ix_matches_donation_id", "donation_id"),
        Index("ix_matches_ngo_id", "ngo_id"),
        Index("ix_matches_ngo_demand_id", "ngo_demand_id"),
        Index("ix_matches_status", "status"),
        Index("ix_matches_ngo_status", "ngo_id", "status"),
        Index("ix_matches_donation_status", "donation_id", "status"),
        CheckConstraint("score >= 0.0 AND score <= 1.0", name="ck_matches_score_range"),
    )
