"""
Tests for pickup completion and demand finalization.
"""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.models.enums import PickupStatus
from app.models.match import Match
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def verify_ngo(client: TestClient, admin_token: str, db) -> NGOProfile:
    ngo = db.query(NGOProfile).filter(NGOProfile.registration_number == "NGO-TEST-001").first()
    assert ngo is not None
    if not ngo.is_verified:
        r = client.patch(
            f"/api/v1/admin/ngos/{ngo.id}/verify",
            json={"approved": True},
            headers=auth(admin_token),
        )
        assert r.status_code == 200, r.text
    db.refresh(ngo)
    return ngo


def create_matched_workflow(client: TestClient, donor_token: str, ngo_token: str, admin_token: str, db):
    ngo = verify_ngo(client, admin_token, db)

    demand_resp = client.post(
        "/api/v1/ngos/demands",
        json={
            "item_category": "clothing",
            "item_name": "Winter Coats",
            "quantity_needed": 12,
            "urgency_level": "high",
        },
        headers=auth(ngo_token),
    )
    assert demand_resp.status_code == 201, demand_resp.text
    demand_id = demand_resp.json()["data"]["id"]

    donation_resp = client.post("/api/v1/donations", json={"notes": "Test donation"}, headers=auth(donor_token))
    assert donation_resp.status_code == 201, donation_resp.text
    donation_id = donation_resp.json()["data"]["id"]

    item_resp = client.post(
        f"/api/v1/donations/{donation_id}/items",
        json={
            "item_name": "Winter Jacket",
            "category": "clothing",
            "quantity": 2,
            "condition": "good",
        },
        headers=auth(donor_token),
    )
    assert item_resp.status_code == 201, item_resp.text

    submit_resp = client.post(f"/api/v1/donations/{donation_id}/submit", headers=auth(donor_token))
    assert submit_resp.status_code == 200, submit_resp.text

    match = db.query(Match).filter(
        Match.donation_id == donation_id,
        Match.ngo_demand_id == demand_id,
    ).first()
    assert match is not None

    pickup_resp = client.post(
        "/api/v1/pickups",
        json={
            "donation_id": donation_id,
            "ngo_id": str(ngo.id),
            "match_id": str(match.id),
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "pickup_address": "123 Test Street",
            "pickup_city": "Bangalore",
            "contact_phone": "9999999999",
            "notes": "Handle carefully",
        },
        headers=auth(ngo_token),
    )
    assert pickup_resp.status_code == 201, pickup_resp.text
    pickup_id = pickup_resp.json()["data"]["id"]

    return demand_id, pickup_id


class TestPickupCompletion:
    def test_completed_pickup_deactivates_related_demand(self, client, donor_token, ngo_token, admin_token, db):
        demand_id, pickup_id = create_matched_workflow(client, donor_token, ngo_token, admin_token, db)

        complete_resp = client.put(
            f"/api/v1/pickups/{pickup_id}/status",
            json={"status": PickupStatus.completed.value},
            headers=auth(ngo_token),
        )
        assert complete_resp.status_code == 200, complete_resp.text

        demand = db.query(NGODemand).filter(NGODemand.id == demand_id).first()
        assert demand is not None
        assert demand.is_active is False
        assert demand.quantity_fulfilled == demand.quantity_needed

        list_resp = client.get("/api/v1/ngos/demands", headers=auth(ngo_token))
        assert list_resp.status_code == 200, list_resp.text
        assert list_resp.json()["pagination"]["total"] == 0
