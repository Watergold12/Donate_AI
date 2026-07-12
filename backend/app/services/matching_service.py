"""
Matching service — orchestrates the matching engine.
Called by donation_service (on submit), ngo_service (on demand create/update),
and the admin API (manual trigger).
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.config import settings
from app.models.donation import Donation
from app.models.enums import AuditAction, DonationStatus, MatchStatus
from app.models.match import Match
from app.models.ngo_demand import NGODemand
from app.utils.audit import log_action
from app.utils.matching_algorithm import find_matches

logger = logging.getLogger(__name__)


def run_matching_for_donation(db: Session, donation: Donation) -> List[Match]:
    """
    Run the matching engine for a single submitted donation.
    Creates Match records for the top-N eligible NGO demands.
    Notifies the donor if any matches are found.
    """
    if donation.status not in (DonationStatus.pending_match, DonationStatus.draft):
        logger.debug("Skipping matching for donation %s — status: %s", donation.id, donation.status)
        return []

    # Resolve donor city/state for geo scoring
    donor_city = donation.donor.city if donation.donor else None
    donor_state = donation.donor.state if donation.donor else None

    scored = find_matches(db, donation, donor_city=donor_city, donor_state=donor_state)

    if not scored:
        logger.info("No eligible matches found for donation %s", donation.id)
        return []

    now = datetime.now(timezone.utc)
    expiry = now + timedelta(hours=settings.match_expiry_hours)
    created_matches: List[Match] = []

    for ms in scored:
        # Avoid duplicate proposed matches for same donation + demand
        existing = db.query(Match).filter(
            Match.donation_id == donation.id,
            Match.ngo_demand_id == ms.ngo_demand.id,
            Match.status == MatchStatus.proposed,
        ).first()
        if existing:
            continue

        match = Match(
            donation_id=donation.id,
            ngo_demand_id=ms.ngo_demand.id,
            ngo_id=ms.ngo_profile.id,
            score=ms.score,
            status=MatchStatus.proposed,
            proposed_at=now,
            expires_at=expiry,
        )
        db.add(match)
        db.flush()
        log_action(db, AuditAction.MATCH, "match", match.id,
                   new_data={"donation_id": str(donation.id), "score": ms.score,
                              "ngo_id": str(ms.ngo_profile.id)})
        created_matches.append(match)

    if created_matches:
        db.commit()
        logger.info("Created %d match(es) for donation %s", len(created_matches), donation.id)
        # Notify donor
        try:
            from app.services.notification_service import notify_match_found
            notify_match_found(db, donation.id, donation.donor.user_id)
        except Exception as exc:
            logger.error("notify_match_found failed: %s", exc)

    return created_matches


def run_matching_for_demand(db: Session, demand: NGODemand) -> int:
    """
    Run the matching engine for a single NGO demand.
    Looks for unmatched submitted donations that could fulfill this demand.
    Returns the number of new matches created.
    """
    if not demand.is_active:
        return 0

    # Find donations in pending_match status
    pending_donations = db.query(Donation).filter(
        Donation.status == DonationStatus.pending_match,
        Donation.deleted_at.is_(None),
    ).all()

    total_created = 0
    for donation in pending_donations:
        donor_city = donation.donor.city if donation.donor else None
        donor_state = donation.donor.state if donation.donor else None
        from app.utils.matching_algorithm import compute_score, THRESHOLD
        items = [i for i in donation.items if i.is_confirmed]
        if not items:
            continue
        ms = compute_score(items, demand, demand.ngo, donor_city, donor_state)
        if ms.score < THRESHOLD:
            continue

        existing = db.query(Match).filter(
            Match.donation_id == donation.id,
            Match.ngo_demand_id == demand.id,
            Match.status == MatchStatus.proposed,
        ).first()
        if existing:
            continue

        now = datetime.now(timezone.utc)
        expiry = now + timedelta(hours=settings.match_expiry_hours)
        match = Match(
            donation_id=donation.id,
            ngo_demand_id=demand.id,
            ngo_id=demand.ngo_id,
            score=ms.score,
            status=MatchStatus.proposed,
            proposed_at=now,
            expires_at=expiry,
        )
        db.add(match)
        db.flush()
        log_action(db, AuditAction.MATCH, "match", match.id,
                   new_data={"demand_id": str(demand.id), "score": ms.score})
        total_created += 1

    if total_created > 0:
        db.commit()
        logger.info("Created %d match(es) for demand %s", total_created, demand.id)

    return total_created


def trigger_full_match(db: Session) -> int:
    """
    Admin-triggered full matching pass.
    Re-runs matching for all pending_match donations against all active demands.
    Returns total new matches created.
    """
    pending = db.query(Donation).filter(
        Donation.status == DonationStatus.pending_match,
        Donation.deleted_at.is_(None),
    ).all()

    total = 0
    for donation in pending:
        created = run_matching_for_donation(db, donation)
        total += len(created)

    logger.info("Full match trigger complete: %d new matches", total)
    return total
