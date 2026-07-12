"""
Tests for NGO profile, demands CRUD, and match handling.
"""
import pytest
from fastapi.testclient import TestClient


def auth(token):
    return {"Authorization": f"Bearer {token}"}


class TestNGOProfile:
    def test_get_profile(self, client, ngo_token):
        r = client.get("/api/v1/ngos/profile", headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["data"]["org_name"] == "Test NGO"

    def test_update_profile(self, client, ngo_token):
        r = client.put("/api/v1/ngos/profile", json={"city": "Mumbai", "state": "Maharashtra"},
                       headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["data"]["city"] == "Mumbai"

    def test_donor_cannot_access_ngo_profile(self, client, donor_token):
        r = client.get("/api/v1/ngos/profile", headers=auth(donor_token))
        assert r.status_code == 403


class TestNGODemands:
    def _verify_ngo(self, client, ngo_token, admin_token, db):
        """Helper: get the NGO profile id and verify it via admin endpoint."""
        from app.models.ngo import NGOProfile
        ngo_profile = db.query(NGOProfile).first()
        if ngo_profile and not ngo_profile.is_verified:
            r = client.patch(
                f"/api/v1/admin/ngos/{ngo_profile.id}/verify",
                json={"approved": True},
                headers=auth(admin_token),
            )
            assert r.status_code == 200

    def test_create_demand_requires_verification(self, client, ngo_token):
        r = client.post("/api/v1/ngos/demands", json={
            "item_category": "clothing", "item_name": "Blankets",
            "quantity_needed": 50, "urgency_level": "high",
        }, headers=auth(ngo_token))
        # Unverified NGO should get 400
        assert r.status_code == 400

    def test_create_demand_verified(self, client, ngo_token, admin_token, db):
        self._verify_ngo(client, ngo_token, admin_token, db)
        r = client.post("/api/v1/ngos/demands", json={
            "item_category": "clothing", "item_name": "Blankets",
            "quantity_needed": 50, "urgency_level": "high",
        }, headers=auth(ngo_token))
        assert r.status_code == 201
        d = r.json()["data"]
        assert d["item_name"] == "Blankets"
        assert d["is_active"] is True

    def test_list_demands(self, client, ngo_token, admin_token, db):
        self._verify_ngo(client, ngo_token, admin_token, db)
        client.post("/api/v1/ngos/demands", json={
            "item_category": "food", "item_name": "Rice",
            "quantity_needed": 100, "urgency_level": "critical",
        }, headers=auth(ngo_token))
        r = client.get("/api/v1/ngos/demands", headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["total"] >= 1

    def test_delete_demand(self, client, ngo_token, admin_token, db):
        self._verify_ngo(client, ngo_token, admin_token, db)
        r = client.post("/api/v1/ngos/demands", json={
            "item_category": "clothing", "item_name": "Socks",
            "quantity_needed": 20, "urgency_level": "low",
        }, headers=auth(ngo_token))
        demand_id = r.json()["data"]["id"]
        r = client.delete(f"/api/v1/ngos/demands/{demand_id}", headers=auth(ngo_token))
        assert r.status_code == 200


class TestNGOMatches:
    def test_list_matches_empty(self, client, ngo_token):
        r = client.get("/api/v1/ngos/matches", headers=auth(ngo_token))
        assert r.status_code == 200
        assert r.json()["pagination"]["total"] == 0

    def test_accept_nonexistent_match(self, client, ngo_token):
        import uuid
        r = client.put(f"/api/v1/ngos/matches/{uuid.uuid4()}/accept", headers=auth(ngo_token))
        assert r.status_code == 404
