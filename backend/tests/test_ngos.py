"""
Tests for NGO profile, demands CRUD, and match handling.
GET/PUT /api/v1/ngos/profile
GET/POST/PUT/DELETE /api/v1/ngos/demands
GET /api/v1/ngos/matches
PUT /api/v1/ngos/matches/{id}/accept|reject
"""
import pytest
from fastapi.testclient import TestClient


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def verify_ngo(client: TestClient, ngo_token: str, admin_token: str, db) -> None:
    """Helper: verify the NGO via admin endpoint so it can create demands."""
    from app.models.ngo import NGOProfile
    ngo = db.query(NGOProfile).first()
    if ngo and not ngo.is_verified:
        r = client.patch(
            f"/api/v1/admin/ngos/{ngo.id}/verify",
            json={"approved": True},
            headers=auth(admin_token),
        )
        assert r.status_code == 200


# ── NGO Profile ───────────────────────────────────────────────────────────

class TestNGOProfile:
    def test_get_profile_success(self, client, ngo_token):
        r = client.get("/api/v1/ngos/profile", headers=auth(ngo_token))
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["org_name"] == "Test NGO"
        assert data["registration_number"] == "NGO-TEST-001"

    def test_update_profile_city(self, client, ngo_token):
        r = client.put(
            "/api/v1/ngos/profile",
            json={"city": "Bangalore", "state": "Karnataka"},
            headers=auth(ngo_token),
        )
        assert r.status_code == 200
        assert r.json()["data"]["city"] == "Bangalore"

    def test_donor_cannot_access_ngo_profile(self, client, donor_token):
        r = client.get("/api/v1/ngos/profile", headers=auth(donor_token))
        assert r.status_code == 403

    def test_unauthenticated_profile_rejected(self, client):
        r = client.get("/api/v1/ngos/profile")
        assert r.status_code == 401


# ── NGO Demands ───────────────────────────────────────────────────────────

class TestNGODemands:
    def test_unverified_ngo_cannot_create_demand(self, client, ngo_token):
        r = client.post(
            "/api/v1/ngos/demands",
            json={"item_category": "clothing", "item_name": "Blankets",
                  "quantity_needed": 50, "urgency_level": "high"},
            headers=auth(ngo_token),
        )
        assert r.status_code == 400

    def test_verified_ngo_creates_demand(self, client, ngo_token, admin_token, db):
        verify_ngo(client, ngo_token, admin_token, db)
        r = client.post(
            "/api/v1/ngos/demands",
            json={"item_category": "clothing", "item_name": "Winter Coats",
                  "quantity_needed": 30, "urgency_level": "high"},
            headers=auth(ngo_token),
        )
        assert r.status_code == 201
        data = r.json()["data"]
        assert data["item_name"] == "Winter Coats"
        assert data["is_active"] is True

    def test_list_demands_empty_initially(self, client, ngo_token):
        r = client.get("/api/v1/ngos/demands", headers=auth(ngo_token))
        assert r.status_code == 200

    def test_list_demands_after_create(self, client, ngo_token, admin_token, db):
        verify_ngo(client, ngo_token, admin_token, db)
        client.post(
            "/api/v1/ngos/demands",
            json={"item_category": "food", "item_name": "Rice",
                  "quantity_needed": 100, "urgency_level": "critical"},
            headers=auth(ngo_token),
        )
        r = client.get("/api/v1/ngos/demands", headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["total"] >= 1

    def test_delete_demand(self, client, ngo_token, admin_token, db):
        verify_ngo(client, ngo_token, admin_token, db)
        r = client.post(
            "/api/v1/ngos/demands",
            json={"item_category": "clothing", "item_name": "Socks",
                  "quantity_needed": 20, "urgency_level": "low"},
            headers=auth(ngo_token),
        )
        demand_id = r.json()["data"]["id"]
        r = client.delete(f"/api/v1/ngos/demands/{demand_id}", headers=auth(ngo_token))
        assert r.status_code == 200

    def test_donor_cannot_create_demand(self, client, donor_token):
        r = client.post(
            "/api/v1/ngos/demands",
            json={"item_category": "clothing", "item_name": "Shoes",
                  "quantity_needed": 10, "urgency_level": "medium"},
            headers=auth(donor_token),
        )
        assert r.status_code == 403


# ── NGO Matches ───────────────────────────────────────────────────────────

class TestNGOMatchesView:
    def test_list_matches_returns_200(self, client, ngo_token):
        r = client.get("/api/v1/ngos/matches", headers=auth(ngo_token))
        assert r.status_code == 200

    def test_list_matches_pagination(self, client, ngo_token):
        r = client.get("/api/v1/ngos/matches?page=1&size=5", headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["size"] == 5

    def test_accept_nonexistent_match_404(self, client, ngo_token):
        import uuid
        r = client.put(
            f"/api/v1/ngos/matches/{uuid.uuid4()}/accept",
            headers=auth(ngo_token),
        )
        assert r.status_code == 404

    def test_reject_nonexistent_match_404(self, client, ngo_token):
        import uuid
        r = client.put(
            f"/api/v1/ngos/matches/{uuid.uuid4()}/reject",
            json={"rejection_reason": "Not suitable"},
            headers=auth(ngo_token),
        )
        assert r.status_code == 404

    def test_ngo_analytics_endpoint(self, client, ngo_token):
        r = client.get("/api/v1/ngos/analytics", headers=auth(ngo_token))
        assert r.status_code == 200
        data = r.json()["data"]
        assert "total_demands" in data
        assert "total_matches" in data
