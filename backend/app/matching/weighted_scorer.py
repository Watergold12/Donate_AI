"""
Weighted rule-based scorer.
Score = 0.25*item_type + 0.20*quantity + 0.15*priority + 0.10*distance + 0.15*urgency + 0.15*semantic
Replace this class with any BaseScorer subclass to use a different model.
"""
import logging
from typing import Optional
from app.matching.base import BaseScorer, ScorerInput, ScorerResult
from app.models.enums import DemandUrgency
from app.utils.matching_algorithm import semantic_match_score

logger = logging.getLogger(__name__)

DEFAULT_WEIGHTS = {
    "item_type": 0.25,
    "quantity":  0.20,
    "priority":  0.15,
    "distance":  0.10,
    "urgency":   0.15,
    "semantic":  0.15,
}

URGENCY_SCORES = {
    DemandUrgency.critical: 1.00,
    DemandUrgency.high:     0.75,
    DemandUrgency.medium:   0.50,
    DemandUrgency.low:      0.25,
}


class WeightedScorer(BaseScorer):
    def __init__(self, weights: Optional[dict] = None) -> None:
        self.weights = weights or DEFAULT_WEIGHTS
        total = sum(self.weights.values())
        assert abs(total - 1.0) < 1e-6, f"Weights must sum to 1.0, got {total}"

    def score(self, inp: ScorerInput) -> ScorerResult:
        type_s     = self._item_type(inp)
        qty_s      = self._quantity(inp)
        priority_s = self._priority(inp)
        dist_s     = self._distance(inp)
        urgency_s  = self._urgency(inp)
        semantic_s = semantic_match_score(inp.donation_items, inp.demand)
        total = (
            self.weights["item_type"] * type_s +
            self.weights["quantity"]  * qty_s  +
            self.weights["priority"]  * priority_s +
            self.weights["distance"]  * dist_s +
            self.weights["urgency"]   * urgency_s +
            self.weights["semantic"]  * semantic_s
        )
        logger.debug(
            "WeightedScorer total=%.4f item_type=%.4f quantity=%.4f priority=%.4f distance=%.4f urgency=%.4f semantic=%.4f",
            round(total, 4), type_s, qty_s, priority_s, dist_s, urgency_s, semantic_s,
        )
        return ScorerResult(
            demand=inp.demand, ngo_profile=inp.ngo_profile,
            total_score=round(total, 4),
            item_type_score=type_s, quantity_score=qty_s,
            priority_score=priority_s, distance_score=dist_s,
            urgency_score=urgency_s,
            breakdown={"weights": self.weights, "item_type": type_s,
                       "quantity": qty_s, "priority": priority_s,
                       "distance": dist_s, "urgency": urgency_s,
                       "semantic": semantic_s},
        )

    def _item_type(self, inp: ScorerInput) -> float:
        for item in inp.donation_items:
            if item.is_confirmed and item.category == inp.demand.item_category:
                return 1.0
        return 0.0

    def _quantity(self, inp: ScorerInput) -> float:
        needed = inp.demand.quantity_needed - inp.demand.quantity_fulfilled
        if needed <= 0:
            return 0.0
        donated = sum(
            i.quantity for i in inp.donation_items
            if i.is_confirmed and i.category == inp.demand.item_category
        )
        return min(1.0, donated / needed)

    def _priority(self, inp: ScorerInput) -> float:
        """Verified NGO with city match gets a boost."""
        base = 0.6
        if inp.ngo_profile.city and inp.donor_city:
            if inp.ngo_profile.city.lower() == inp.donor_city.lower():
                return min(1.0, base + 0.4)
        return base

    def _distance(self, inp: ScorerInput) -> float:
        ngo   = inp.ngo_profile
        city  = (inp.donor_city  or "").lower()
        state = (inp.donor_state or "").lower()
        if not city and not state:
            return 0.1
        if ngo.service_areas:
            areas = [a.lower() for a in ngo.service_areas]
            if city  and city  in areas: return 1.0
            if state and state in areas: return 0.85
        if city  and ngo.city  and city  == ngo.city.lower():  return 1.0
        if state and ngo.state and state == ngo.state.lower(): return 0.5
        return 0.1

    def _urgency(self, inp: ScorerInput) -> float:
        return URGENCY_SCORES.get(inp.demand.urgency_level, 0.25)
