"""
Abstract scorer interface.
Any future scoring model (ML, rule-based, AI) must implement BaseScorer.
Swap the scoring algorithm by passing a different BaseScorer subclass
to MatchingEngine — no API or service code needs to change.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
from app.models.donation import DonationItem
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand


@dataclass
class ScorerInput:
    """All inputs a scorer needs to compute a match score."""
    donation_items: List[DonationItem]
    demand: NGODemand
    ngo_profile: NGOProfile
    donor_city: Optional[str] = None
    donor_state: Optional[str] = None
    donor_pincode: Optional[str] = None


@dataclass
class ScorerResult:
    """Result returned by any scorer implementation."""
    demand: NGODemand
    ngo_profile: NGOProfile
    total_score: float
    item_type_score: float
    quantity_score: float
    priority_score: float
    distance_score: float
    urgency_score: float
    breakdown: dict = field(default_factory=dict)


class BaseScorer(ABC):
    """
    Abstract base for all scorers.
    Implement this to plug in ML models, LLM rankers, or custom rules.
    """

    @abstractmethod
    def score(self, inp: ScorerInput) -> ScorerResult:
        """Compute a match score. Must return ScorerResult with total_score in [0, 1]."""
        ...

    @property
    def name(self) -> str:
        return self.__class__.__name__
