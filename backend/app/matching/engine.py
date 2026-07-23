"""
Matching Engine — orchestrates scoring, filtering, and Top-N ranking.
Pluggable: pass any BaseScorer to swap the algorithm without changing API code.
"""
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.matching.base import BaseScorer, ScorerInput
from app.matching.weighted_scorer import WeightedScorer
from app.models.donation import Donation, DonationItem
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand
from app.utils.matching_algorithm import MatchingScore, build_match_explanation

logger = logging.getLogger(__name__)

TOP_N     = 5
THRESHOLD = 0.30


@dataclass
class MatchCandidate:
    """A ranked NGO candidate returned by the engine."""
    rank: int
    ngo_id: str
    ngo_name: str
    demand_id: str
    item_category: str
    quantity_needed: int
    quantity_fulfilled: int
    urgency: str
    city: Optional[str]
    total_score: float
    item_type_score: float
    quantity_score: float
    priority_score: float
    distance_score: float
    urgency_score: float
    semantic_score: float
    score_breakdown: dict
    match_explanation: list[str]


class MatchingEngine:
    """
    Core ranking engine.
    Inject a different BaseScorer subclass to swap the ranking algorithm
    (e.g. ML model, LLM ranker) without changing any API or service code.
    """

    def __init__(self, scorer: Optional[BaseScorer] = None) -> None:
        self.scorer: BaseScorer = scorer or WeightedScorer()
        logger.info("MatchingEngine using scorer: %s", self.scorer.name)

    def rank(
        self,
        db: Session,
        donation: Donation,
        donor_city: Optional[str] = None,
        donor_state: Optional[str] = None,
        donor_pincode: Optional[str] = None,
        top_n: int = TOP_N,
        threshold: float = THRESHOLD,
    ) -> List[MatchCandidate]:
        """
        Find and rank the top-N NGOs for a donation.
        Returns MatchCandidate list sorted by total_score descending.
        """
        items: List[DonationItem] = [i for i in donation.items if i.is_confirmed]
        if not items:
            logger.debug("No confirmed items in donation %s", donation.id)
            return []

        categories = {i.category for i in items}
        now = datetime.now(timezone.utc)

        # Efficient DB query — only fetch active demands whose category overlaps
        demands: List[NGODemand] = (
            db.query(NGODemand)
            .join(NGOProfile, NGODemand.ngo_id == NGOProfile.id)
            .filter(
                NGODemand.is_active.is_(True),
                NGODemand.item_category.in_(categories),
                NGOProfile.is_verified.is_(True),
                (NGODemand.expires_at.is_(None)) | (NGODemand.expires_at > now),
            )
            .all()
        )

        if not demands:
            logger.info("No eligible demands found for donation %s", donation.id)
            return []

        # Score every candidate
        scored = []
        for demand in demands:
            inp = ScorerInput(
                donation_items=items,
                demand=demand,
                ngo_profile=demand.ngo,
                donor_city=donor_city,
                donor_state=donor_state,
                donor_pincode=donor_pincode,
            )
            result = self.scorer.score(inp)
            if result.total_score >= threshold:
                scored.append(result)

        # Sort descending, return top_n
        scored.sort(key=lambda r: r.total_score, reverse=True)
        top = scored[:top_n]

        candidates = [
            MatchCandidate(
                rank=i + 1,
                ngo_id=str(r.ngo_profile.id),
                ngo_name=r.ngo_profile.org_name,
                demand_id=str(r.demand.id),
                item_category=r.demand.item_category.value,
                quantity_needed=r.demand.quantity_needed,
                quantity_fulfilled=r.demand.quantity_fulfilled,
                urgency=r.demand.urgency_level.value,
                city=r.ngo_profile.city,
                total_score=r.total_score,
                item_type_score=r.item_type_score,
                quantity_score=r.quantity_score,
                priority_score=r.priority_score,
                distance_score=r.distance_score,
                urgency_score=r.urgency_score,
                semantic_score=float(r.breakdown.get("semantic", 0.0)),
                score_breakdown=r.breakdown,
                match_explanation=build_match_explanation(
                    MatchingScore(
                        ngo_demand=r.demand,
                        ngo_profile=r.ngo_profile,
                        score=r.total_score,
                        category_score=float(r.breakdown.get("item_type", 0.0)),
                        quantity_score=r.quantity_score,
                        urgency_score=r.urgency_score,
                        geo_score=r.distance_score,
                        semantic_score=float(r.breakdown.get("semantic", 0.0)),
                    )
                ),
            )
            for i, r in enumerate(top)
        ]

        logger.info(
            "MatchingEngine ranked %d/%d candidates for donation %s",
            len(candidates), len(scored), donation.id,
        )
        return candidates


# Module-level singleton — default WeightedScorer
_engine: Optional[MatchingEngine] = None


def get_engine(scorer: Optional[BaseScorer] = None) -> MatchingEngine:
    """Return the default engine singleton, or a new engine with a custom scorer."""
    global _engine
    if scorer is not None:
        return MatchingEngine(scorer=scorer)
    if _engine is None:
        _engine = MatchingEngine()
    return _engine
