"""
Tests for donation lifecycle endpoints.
POST   /api/v1/donations                     — create
POST   /api/v1/donations/{id}/items          — add item
POST   /api/v1/donations/{id}/submit         — submit for matching
DELETE /api/v1/donations/{id}                — cancel
GET    /api/v1/donors/donations              — list
GET    /api/v1/donors/history                — history
"""
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.models.match import Match
from app.models.ngo import NGOProfile


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Helpers ───────────────────────────────────────────────────────────────

def create_donation(client: TestClient, token: str, notes: str = "") -> dict:
    r = client.post("/api/v1/donations", json={"notes": notes}, headers=auth(token))
    assert r.status_code == 201, f"Create failed: {r.text}"
    return r.json()["data"]


def add_item(client: TestClient, token: str, donation_id: str, **kwargs) -> dict:
    payload = {
        "item_name": kwargs.get("item_name", "Winter Jacket"),
        "category":  kwargs.get("category", "clothing"),
        "quantity":  kwargs.get("quantity", 2),
        "condition": kwargs.get("condition", "good"),
    }
    r = client.post(f"/api/v1/donations/{donation_id}/items", json=payload, headers=auth(token))
    assert r.status_code == 201, f"Add item failed: {r.text}"
    return r.json()["data"]


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


# ── Create ────────────────────────────────────────────────────────────────

class TestCreateDonation:
    def test_create_draft_success(self, client, donor_token):
        d = create_donation(client, donor_token, notes="Handle with care")
        assert d["status"] == "draft"
        assert d["notes"] == "Handle with care"
        assert d["total_items"] == 0

    def test_create_without_notes(self, client, donor_token):
        d = create_donation(client, donor_token)
        assert d["status"] == "draft"

    def test_ngo_cannot_create_donation(self, client, ngo_token):
        r = client.post("/api/v1/donations", json={}, headers=auth(ngo_token))
        assert r.status_code == 403

    def test_unauthenticated_rejected(self, client):
        r = client.post("/api/v1/donations", json={})
        assert r.status_code == 401


# ── Add Items ─────────────────────────────────────────────────────────────

class TestAddItems:
    def test_add_item_success(self, client, donor_token):
        d = create_donation(client, donor_token)
        item = add_item(client, donor_token, d["id"])
        assert item["item_name"] == "Winter Jacket"
        assert item["category"] == "clothing"
        assert item["quantity"] == 2

    def test_total_items_increments(self, client, donor_token):
        d = create_donation(client, donor_token)
        add_item(client, donor_token, d["id"], quantity=3)
        add_item(client, donor_token, d["id"], quantity=5)
        r = client.get(f"/api/v1/donations/{d['id']}/items", headers=auth(donor_token))
        assert r.status_code == 200

    def test_add_item_invalid_category(self, client, donor_token):
        d = create_donation(client, donor_token)
        r = client.post(
            f"/api/v1/donations/{d['id']}/items",
            json={"item_name": "X", "category": "invalid", "quantity": 1, "condition": "good"},
            headers=auth(donor_token),
        )
        assert r.status_code == 422

    def test_cannot_add_item_to_nonexistent_donation(self, client, donor_token):
        import uuid
        r = client.post(
            f"/api/v1/donations/{uuid.uuid4()}/items",
            json={"item_name": "Book", "category": "books", "quantity": 1, "condition": "good"},
            headers=auth(donor_token),
        )
        assert r.status_code == 404

# ── Submit ────────────────────────────────────────────────────────────────

class TestSubmitDonation:
    def test_submit_success(self, client, donor_token):
        d = create_donation(client, donor_token)
        add_item(client, donor_token, d["id"])
        r = client.post(f"/api/v1/donations/{d['id']}/submit", headers=auth(donor_token))
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "pending_match"

    def test_submit_empty_donation_fails(self, client, donor_token):
        d = create_donation(client, donor_token)
        r = client.post(f"/api/v1/donations/{d['id']}/submit", headers=auth(donor_token))
        assert r.status_code == 400

    def test_submit_sets_submitted_at(self, client, donor_token):
        d = create_donation(client, donor_token)
        add_item(client, donor_token, d["id"])
        r = client.post(f"/api/v1/donations/{d['id']}/submit", headers=auth(donor_token))
        assert r.json()["data"]["submitted_at"] is not None

    def test_cannot_submit_other_donors_donation(self, client, donor_token, ngo_token):
        """NGO cannot submit a donor's donation."""
        d = create_donation(client, donor_token)
        add_item(client, donor_token, d["id"])
        r = client.post(f"/api/v1/donations/{d['id']}/submit", headers=auth(ngo_token))
        assert r.status_code == 403


# ── Cancel ────────────────────────────────────────────────────────────────

class TestCancelDonation:
    def test_cancel_draft_success(self, client, donor_token):
        d = create_donation(client, donor_token)
        r = client.delete(f"/api/v1/donations/{d['id']}", headers=auth(donor_token))
        assert r.status_code == 200

    def test_cancel_submitted_donation(self, client, donor_token):
        d = create_donation(client, donor_token)
        add_item(client, donor_token, d["id"])
        client.post(f"/api/v1/donations/{d['id']}/submit", headers=auth(donor_token))
        r = client.delete(f"/api/v1/donations/{d['id']}", headers=auth(donor_token))
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "cancelled"

    def test_cannot_cancel_other_donors_donation(self, client, donor_token, ngo_token):
        d = create_donation(client, donor_token)
        r = client.delete(f"/api/v1/donations/{d['id']}", headers=auth(ngo_token))
        assert r.status_code == 403


# ── List / History ────────────────────────────────────────────────────────

class TestListDonations:
    def test_list_my_donations(self, client, donor_token):
        create_donation(client, donor_token, notes="First")
        create_donation(client, donor_token, notes="Second")
        r = client.get("/api/v1/donors/donations", headers=auth(donor_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["total"] >= 2

    def test_list_pagination_params(self, client, donor_token):
        r = client.get("/api/v1/donors/donations?page=1&size=1", headers=auth(donor_token))
        assert r.status_code == 200
        assert len(r.json()["data"]) <= 1

    def test_list_status_filter(self, client, donor_token):
        d = create_donation(client, donor_token)
        add_item(client, donor_token, d["id"])
        client.post(f"/api/v1/donations/{d['id']}/submit", headers=auth(donor_token))
        r = client.get("/api/v1/donors/donations?status_filter=pending_match", headers=auth(donor_token))
        assert r.status_code == 200
        for donation in r.json()["data"]:
            assert donation["status"] == "pending_match"

    def test_history_endpoint(self, client, donor_token):
        r = client.get("/api/v1/donors/history", headers=auth(donor_token))
        assert r.status_code == 200
        assert "data" in r.json()

    def test_ngo_cannot_list_donor_donations(self, client, ngo_token):
        r = client.get("/api/v1/donors/donations", headers=auth(ngo_token))
        assert r.status_code == 403

    def test_unauthenticated_list_rejected(self, client):
        r = client.get("/api/v1/donors/donations")
        assert r.status_code == 401


class TestPackagingChecklist:
    def test_packaging_checklist_acknowledge_and_pickup_flow(self, client, donor_token, ngo_token, admin_token, db):
        ngo = verify_ngo(client, admin_token, db)

        demand_resp = client.post(
            "/api/v1/ngos/demands",
            json={
                "item_category": "clothing",
                "item_name": "Winter Jackets",
                "quantity_needed": 10,
                "urgency_level": "high",
            },
            headers=auth(ngo_token),
        )
        assert demand_resp.status_code == 201, demand_resp.text

        donation = create_donation(client, donor_token, notes="Packaging test")
        add_item(client, donor_token, donation["id"], item_name="Winter Jacket", quantity=4)
        submit_resp = client.post(f"/api/v1/donations/{donation['id']}/submit", headers=auth(donor_token))
        assert submit_resp.status_code == 200, submit_resp.text

        match = db.query(Match).filter(Match.donation_id == donation["id"]).first()
        assert match is not None

        accept_resp = client.put(
            f"/api/v1/ngos/matches/{match.id}/accept",
            headers=auth(ngo_token),
        )
        assert accept_resp.status_code == 200, accept_resp.text

        checklist_resp = client.post(
            f"/api/v1/donations/{donation['id']}/packaging-checklist",
            headers=auth(donor_token),
        )
        assert checklist_resp.status_code == 200, checklist_resp.text
        checklist = checklist_resp.json()["data"]
        assert checklist["status"] == "packaging_notified"
        assert checklist["acknowledged"] is False
        assert len(checklist["general_steps"]) > 0
        assert len(checklist["item_guidance"]) > 0

        ack_resp = client.post(
            f"/api/v1/donations/{donation['id']}/packaging-checklist/acknowledge",
            headers=auth(donor_token),
        )
        assert ack_resp.status_code == 200, ack_resp.text
        assert ack_resp.json()["data"]["status"] == "acknowledged"

        pickup_resp = client.post(
            "/api/v1/pickups",
            json={
                "donation_id": donation["id"],
                "ngo_id": str(ngo.id),
                "match_id": str(match.id),
                "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                "pickup_address": "123 Test Street",
                "pickup_city": "Bangalore",
                "contact_phone": "+919999999999",
                "notes": "Leave at reception",
            },
            headers=auth(ngo_token),
        )
        assert pickup_resp.status_code == 201, pickup_resp.text
        assert pickup_resp.json()["data"]["status"] == "scheduled"
