"""
Tests for matching endpoints and NGO accept/reject flows.
GET  /api/v1/matching/results
POST /api/v1/matching/trigger   [admin]
POST /api/v1/ngos/matches/{id}/accept
POST /api/v1/ngos/matches/{id}/reject
"""
import pytest
from fastapi.testclient import TestClient


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_and_submit_donation(client: TestClient, donor_token: str) -> str:
    """Helper: create a donation with one item and submit it. Returns donation id."""
    r = client.post("/api/v1/donations", json={}, headers=auth(donor_token))
    assert r.status_code == 201
    donation_id = r.json()["data"]["id"]
    client.post(
        f"/api/v1/donations/{donation_id}/items",
        json={"item_name": "T-Shirt", "category": "clothing", "quantity": 5, "condition": "good"},
        headers=auth(donor_token),
    )
    r = client.post(f"/api/v1/donations/{donation_id}/submit", headers=auth(donor_token))
    assert r.status_code == 200
    return donation_id


# ── Matching Results ──────────────────────────────────────────────────────

class TestMatchingResults:
    def test_donor_can_view_own_matches(self, client, donor_token):
        r = client.get("/api/v1/matching/results", headers=auth(donor_token))
        assert r.status_code == 200
        assert "data" in r.json()

    def test_ngo_can_view_matches(self, client, ngo_token):
        r = client.get("/api/v1/matching/results", headers=auth(ngo_token))
        assert r.status_code == 200

    def test_admin_can_view_all_matches(self, client, admin_token):
        r = client.get("/api/v1/matching/results", headers=auth(admin_token))
        assert r.status_code == 200

    def test_unauthenticated_rejected(self, client):
        r = client.get("/api/v1/matching/results")
        assert r.status_code == 401

    def test_status_filter_accepted(self, client, donor_token):
        r = client.get("/api/v1/matching/results?status_filter=proposed", headers=auth(donor_token))
        assert r.status_code == 200

    def test_status_filter_invalid_ignored(self, client, donor_token):
        r = client.get("/api/v1/matching/results?status_filter=notavalue", headers=auth(donor_token))
        # Should return 422 for invalid enum
        assert r.status_code in (200, 422)

# ── Matching Trigger ──────────────────────────────────────────────────────

class TestMatchingTrigger:
    def test_admin_can_trigger(self, client, admin_token):
        r = client.post("/api/v1/matching/trigger", headers=auth(admin_token))
        assert r.status_code == 200
        assert "match" in r.json()["message"].lower()

    def test_donor_cannot_trigger(self, client, donor_token):
        r = client.post("/api/v1/matching/trigger", headers=auth(donor_token))
        assert r.status_code == 403

    def test_ngo_cannot_trigger(self, client, ngo_token):
        r = client.post("/api/v1/matching/trigger", headers=auth(ngo_token))
        assert r.status_code == 403

    def test_unauthenticated_cannot_trigger(self, client):
        r = client.post("/api/v1/matching/trigger")
        assert r.status_code == 401


# ── Accept / Reject Matches ───────────────────────────────────────────────

class TestMatchAcceptReject:
    def test_accept_nonexistent_match_returns_404(self, client, ngo_token):
        import uuid
        r = client.put(
            f"/api/v1/ngos/matches/{uuid.uuid4()}/accept",
            headers=auth(ngo_token),
        )
        assert r.status_code == 404

    def test_reject_nonexistent_match_returns_404(self, client, ngo_token):
        import uuid
        r = client.put(
            f"/api/v1/ngos/matches/{uuid.uuid4()}/reject",
            headers=auth(ngo_token),
        )
        assert r.status_code == 404

    def test_donor_cannot_accept_match(self, client, donor_token):
        import uuid
        r = client.put(
            f"/api/v1/ngos/matches/{uuid.uuid4()}/accept",
            headers=auth(donor_token),
        )
        # donor role → 403 before 404
        assert r.status_code == 403

    def test_ngo_list_matches_empty_by_default(self, client, ngo_token):
        r = client.get("/api/v1/ngos/matches", headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["total"] == 0

    def test_matching_flow_after_submit(self, client, donor_token):
        """
        Submit a donation → matching engine runs → check results endpoint.
        No matches expected unless a verified NGO demand exists.
        """
        create_and_submit_donation(client, donor_token)
        r = client.get("/api/v1/matching/results", headers=auth(donor_token))
        assert r.status_code == 200
        # data may be empty — engine ran without error is the assertion
        assert isinstance(r.json()["data"], list)
