"""
Tests for matching algorithm and matching API.
"""
import pytest
from fastapi.testclient import TestClient


def auth(token):
    return {"Authorization": f"Bearer {token}"}


class TestMatchingResults:
    def test_donor_can_view_matches(self, client, donor_token):
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


class TestMatchingAlgorithm:
    def test_matching_score_after_submit(self, client, donor_token, ngo_token, db):
        """Submit a donation and verify matching runs without error."""
        # Create and submit donation with a clothing item
        r = client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        donation_id = r.json()["data"]["id"]
        client.post(f"/api/v1/donations/{donation_id}/items", json={
            "item_name": "T-Shirt", "category": "clothing", "quantity": 5, "condition": "good",
        }, headers=auth(donor_token))
        r = client.post(f"/api/v1/donations/{donation_id}/submit", headers=auth(donor_token))
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "pending_match"
        # Matches endpoint should return successfully (may be empty if NGO not verified)
        r = client.get("/api/v1/matching/results", headers=auth(donor_token))
        assert r.status_code == 200
