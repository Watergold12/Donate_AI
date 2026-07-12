"""
Tests for donation lifecycle endpoints.
POST   /api/v1/donations
POST   /api/v1/donations/{id}/items
POST   /api/v1/donations/{id}/submit
DELETE /api/v1/donations/{id}
GET    /api/v1/donors/donations
GET    /api/v1/donors/history
"""
import pytest
from fastapi.testclient import TestClient


def auth(token):
    return {"Authorization": f"Bearer {token}"}


class TestDonationCRUD:
    def test_create_donation(self, client, donor_token):
        r = client.post("/api/v1/donations", json={"notes": "Handle with care"}, headers=auth(donor_token))
        assert r.status_code == 201
        d = r.json()["data"]
        assert d["status"] == "draft"
        return d["id"]

    def test_add_item_to_donation(self, client, donor_token):
        # Create donation first
        r = client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        assert r.status_code == 201
        donation_id = r.json()["data"]["id"]

        r = client.post(f"/api/v1/donations/{donation_id}/items", json={
            "item_name": "Winter Jacket", "category": "clothing",
            "quantity": 3, "condition": "good",
        }, headers=auth(donor_token))
        assert r.status_code == 201
        item = r.json()["data"]
        assert item["item_name"] == "Winter Jacket"
        assert item["quantity"] == 3

    def test_submit_donation(self, client, donor_token):
        r = client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        donation_id = r.json()["data"]["id"]
        client.post(f"/api/v1/donations/{donation_id}/items", json={
            "item_name": "Shoes", "category": "clothing", "quantity": 1, "condition": "good",
        }, headers=auth(donor_token))

        r = client.post(f"/api/v1/donations/{donation_id}/submit", headers=auth(donor_token))
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "pending_match"

    def test_submit_empty_donation_fails(self, client, donor_token):
        r = client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        donation_id = r.json()["data"]["id"]
        r = client.post(f"/api/v1/donations/{donation_id}/submit", headers=auth(donor_token))
        assert r.status_code == 400

    def test_cancel_donation(self, client, donor_token):
        r = client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        donation_id = r.json()["data"]["id"]
        r = client.delete(f"/api/v1/donations/{donation_id}", headers=auth(donor_token))
        assert r.status_code == 200

    def test_list_donations(self, client, donor_token):
        # Create a couple
        client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        client.post("/api/v1/donations", json={}, headers=auth(donor_token))
        r = client.get("/api/v1/donors/donations", headers=auth(donor_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["total"] >= 2

    def test_donation_history(self, client, donor_token):
        r = client.get("/api/v1/donors/history", headers=auth(donor_token))
        assert r.status_code == 200
        assert "data" in r.json()

    def test_ngo_cannot_create_donation(self, client, ngo_token):
        r = client.post("/api/v1/donations", json={}, headers=auth(ngo_token))
        assert r.status_code == 403
