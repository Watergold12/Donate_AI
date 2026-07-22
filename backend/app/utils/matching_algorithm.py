"""
Matching algorithm — weighted scoring engine.

Score = (0.35 × category) + (0.20 × quantity) + (0.20 × urgency) + (0.10 × geo) + (0.15 × semantic)
Threshold: score >= 0.50 to be eligible. Top 3 matches proposed per donation.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
import re
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.donation import Donation, DonationItem
from app.models.enums import DemandUrgency, ItemCategory
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand

# ── Weights ─────────────────────────────────────────────────────────────────
WEIGHTS = {
    "category": 0.35,
    "quantity": 0.20,
    "urgency": 0.20,
    "geo": 0.10,
    "semantic": 0.15,
}

# ── Thresholds ───────────────────────────────────────────────────────────────
THRESHOLD: float = 0.50
TOP_N: int = 3

# ── Urgency score map ────────────────────────────────────────────────────────
URGENCY_SCORES = {
    DemandUrgency.critical: 1.00,
    DemandUrgency.high:     0.75,
    DemandUrgency.medium:   0.50,
    DemandUrgency.low:      0.25,
}


@dataclass
class MatchingScore:
    """Result of scoring a donation against a single NGO demand."""
    ngo_demand: NGODemand
    ngo_profile: NGOProfile
    score: float
    category_score: float
    quantity_score: float
    urgency_score: float
    geo_score: float
    semantic_score: float


CATEGORY_HINTS = {
    ItemCategory.clothing: {"clothes", "clothing", "apparel", "garment", "shirt", "pants", "dress", "jacket"},
    ItemCategory.food: {"food", "meal", "mealpack", "groceries", "grocer", "rice", "grain", "cereal", "ration"},
    ItemCategory.electronics: {"electronic", "electronics", "device", "gadget", "mobile", "phone", "charger", "laptop"},
    ItemCategory.furniture: {"furniture", "chair", "table", "desk", "cabinet", "sofa", "shelf", "bed"},
    ItemCategory.books: {"book", "books", "notebook", "textbook", "reading", "stationery"},
    ItemCategory.medical: {"medical", "medicine", "medicines", "health", "aid", "firstaid", "syringe", "bandage"},
    ItemCategory.toys: {"toy", "toys", "game", "games", "play", "puzzle"},
    ItemCategory.other: {"other", "misc", "miscellaneous"},
}

STOPWORDS = {
    "and", "for", "the", "with", "set", "of", "a", "an", "to", "in", "on", "at", "by", "from",
    "needed", "need", "requirements", "requirement", "items", "item", "donation", "donations",
}


def _tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if token not in STOPWORDS and len(token) > 1
    }


def _category_tokens(category: ItemCategory) -> set[str]:
    return {category.value, *CATEGORY_HINTS.get(category, set())}


def _category_score(donation_items: List[DonationItem], demand: NGODemand) -> float:
    """1.0 if any confirmed donation item matches the demand category, else 0.0."""
    demand_cat = demand.item_category
    for item in donation_items:
        if item.is_confirmed and item.category == demand_cat:
            return 1.0
    return 0.0


def _quantity_score(donation_items: List[DonationItem], demand: NGODemand) -> float:
    """Ratio of donated quantity to needed quantity, capped at 1.0."""
    demand_cat = demand.item_category
    donated_qty = sum(
        item.quantity for item in donation_items
        if item.is_confirmed and item.category == demand_cat
    )
    needed = demand.quantity_needed - demand.quantity_fulfilled
    if needed <= 0:
        return 0.0
    return min(1.0, donated_qty / needed)


def _urgency_score(demand: NGODemand) -> float:
    """Map urgency enum to a 0–1 score."""
    return URGENCY_SCORES.get(demand.urgency_level, 0.25)


def _geo_score(donor_city: Optional[str], donor_state: Optional[str],
               ngo_profile: NGOProfile) -> float:
    """
    Geographic proximity score.
    same city → 1.0, same state → 0.5, different → 0.1
    """
    if not donor_city and not donor_state:
        return 0.1

    # Check service areas list first
    if ngo_profile.service_areas:
        if donor_city and donor_city.lower() in [s.lower() for s in ngo_profile.service_areas]:
            return 1.0
        if donor_state and donor_state.lower() in [s.lower() for s in ngo_profile.service_areas]:
            return 0.5

    # Fall back to NGO's registered city/state
    if donor_city and ngo_profile.city:
        if donor_city.lower() == ngo_profile.city.lower():
            return 1.0
    if donor_state and ngo_profile.state:
        if donor_state.lower() == ngo_profile.state.lower():
            return 0.5

    return 0.1


def _semantic_score(donation_items: List[DonationItem], demand: NGODemand) -> float:
    """
    Lightweight semantic similarity score based on item/demand name overlap
    and category hints. This gives us a practical approximation of vector
    similarity without adding a heavy embedding pipeline.
    """
    donation_tokens: set[str] = set()
    for item in donation_items:
        if not item.is_confirmed:
            continue
        donation_tokens |= _tokenize(item.item_name)
        donation_tokens |= _category_tokens(item.category)

    demand_tokens = _tokenize(demand.item_name)
    demand_tokens |= _category_tokens(demand.item_category)

    if not donation_tokens or not demand_tokens:
        return 0.0

    union = donation_tokens | demand_tokens
    overlap = donation_tokens & demand_tokens
    token_score = len(overlap) / len(union)

    exact_name_boost = 0.0
    demand_name = demand.item_name.lower()
    for item in donation_items:
        if not item.is_confirmed:
            continue
        item_name = item.item_name.lower()
        if item_name and demand_name and (item_name in demand_name or demand_name in item_name):
            exact_name_boost = 1.0
            break

    category_boost = 1.0 if any(item.is_confirmed and item.category == demand.item_category for item in donation_items) else 0.0

    return round(min(1.0, max(token_score, 0.4 * category_boost, 0.85 * exact_name_boost)), 4)


def semantic_match_score(donation_items: List[DonationItem], demand: NGODemand) -> float:
    """Public wrapper for the lightweight semantic similarity score."""
    return _semantic_score(donation_items, demand)


def compute_score(
    donation_items: List[DonationItem],
    demand: NGODemand,
    ngo_profile: NGOProfile,
    donor_city: Optional[str] = None,
    donor_state: Optional[str] = None,
) -> MatchingScore:
    """Compute a weighted match score for one donation vs one NGO demand."""
    cat   = _category_score(donation_items, demand)
    qty   = _quantity_score(donation_items, demand)
    urg   = _urgency_score(demand)
    geo   = _geo_score(donor_city, donor_state, ngo_profile)
    sem   = _semantic_score(donation_items, demand)

    total = (
        WEIGHTS["category"] * cat +
        WEIGHTS["quantity"] * qty +
        WEIGHTS["urgency"] * urg +
        WEIGHTS["geo"] * geo +
        WEIGHTS["semantic"] * sem
    )

    return MatchingScore(
        ngo_demand=demand,
        ngo_profile=ngo_profile,
        score=round(total, 4),
        category_score=cat,
        quantity_score=qty,
        urgency_score=urg,
        geo_score=geo,
        semantic_score=sem,
    )


def build_score_breakdown(score: MatchingScore) -> dict:
    """Serialisable score breakdown for API responses and UI transparency."""
    return {
        "weights": WEIGHTS,
        "category": score.category_score,
        "quantity": score.quantity_score,
        "urgency": score.urgency_score,
        "geo": score.geo_score,
        "semantic": score.semantic_score,
        "total": score.score,
    }


def build_match_explanation(score: MatchingScore) -> list[str]:
    """Human-readable explanation for why a donation matched a demand."""
    explanation: list[str] = []

    if score.category_score >= 1.0:
        explanation.append(f"Category match: {score.ngo_demand.item_category.value.title()} items align with this NGO demand.")
    elif score.semantic_score >= 0.5:
        explanation.append(
            f"Semantic match: {score.ngo_demand.item_name} is closely related to the donated items."
        )

    explanation.append(
        f"Quantity fit: {int(round(score.quantity_score * 100))}% of the required quantity is covered."
    )
    explanation.append(
        f"Urgency level: This is a {score.ngo_demand.urgency_level.value} priority request."
    )

    if score.geo_score >= 1.0:
        explanation.append("Location match: The NGO is in the same city / service area as the donor.")
    elif score.geo_score >= 0.5:
        explanation.append("Location match: The NGO is in the same state / service area as the donor.")
    else:
        explanation.append("Location match: The NGO is outside the donor's immediate area, but still eligible.")

    return explanation


def find_matches(
    db: Session,
    donation: Donation,
    donor_city: Optional[str] = None,
    donor_state: Optional[str] = None,
) -> List[MatchingScore]:
    """
    Find the top-N eligible NGO demands for a given donation.

    Steps:
    1. Load confirmed items for the donation.
    2. Load all active, non-expired NGO demands from verified NGOs.
    3. Score each demand using compute_score.
    4. Filter by THRESHOLD and return top TOP_N sorted by score descending.
    """
    # Load confirmed items
    items = [i for i in donation.items if i.is_confirmed]
    if not items:
        return []

    # Get categories present in donation (for pre-filter)
    donation_categories = {item.category for item in items}

    now = datetime.now(timezone.utc)

    # Load active demands whose category matches something in the donation
    demands = (
        db.query(NGODemand)
        .join(NGOProfile, NGODemand.ngo_id == NGOProfile.id)
        .filter(
            NGODemand.is_active.is_(True),
            NGODemand.item_category.in_(donation_categories),
            NGOProfile.is_verified.is_(True),
            # Exclude expired demands
            (NGODemand.expires_at.is_(None)) | (NGODemand.expires_at > now),
        )
        .all()
    )

    if not demands:
        return []

    # Score each demand
    scores: List[MatchingScore] = []
    for demand in demands:
        ms = compute_score(items, demand, demand.ngo, donor_city, donor_state)
        if ms.score >= THRESHOLD:
            scores.append(ms)

    # Sort by score descending, return top N
    scores.sort(key=lambda x: x.score, reverse=True)
    return scores[:TOP_N]
