"""
Tests for authentication endpoints.
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
"""
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
class TestRegister:
    def test_register_donor_success(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "new@donor.com", "password": "Password1!", "full_name": "New Donor", "role": "donor",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["success"] is True
        assert data["data"]["email"] == "new@donor.com"
        assert data["data"]["role"] == "donor"

    def test_register_ngo_success(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "ngo@org.com", "password": "Password1!", "full_name": "New NGO",
            "role": "ngo", "org_name": "Helping Hands", "registration_number": "REG-001",
        })
        assert r.status_code == 201
        assert r.json()["data"]["role"] == "ngo"

    def test_register_duplicate_email(self, client, donor_token):
        r = client.post("/api/v1/auth/register", json={
            "email": "donor@test.com", "password": "Password1!", "full_name": "Dupe", "role": "donor",
        })
        assert r.status_code == 409

    def test_register_admin_blocked(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "admin2@test.com", "password": "Password1!", "full_name": "Hacker", "role": "admin",
        })
        assert r.status_code == 422

    def test_register_ngo_missing_org_name(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "bado@ngo.com", "password": "Password1!", "full_name": "Bad NGO",
            "role": "ngo", "registration_number": "REG-002",
        })
        assert r.status_code == 400

    def test_register_weak_password(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "weak@test.com", "password": "abc", "full_name": "Weak", "role": "donor",
        })
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class TestLogin:
    def test_login_success(self, client, donor_token):
        # donor_token fixture already logs in; just verify token is a non-empty string
        assert isinstance(donor_token, str) and len(donor_token) > 10

    def test_login_wrong_password(self, client, donor_token):
        r = client.post("/api/v1/auth/login", json={"email": "donor@test.com", "password": "WrongPass!"})
        assert r.status_code == 401

    def test_login_unknown_email(self, client):
        r = client.post("/api/v1/auth/login", json={"email": "nobody@test.com", "password": "Any1234!"})
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# /me
# ---------------------------------------------------------------------------
class TestMe:
    def test_get_me_authenticated(self, client, donor_token):
        r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {donor_token}"})
        assert r.status_code == 200
        assert r.json()["data"]["email"] == "donor@test.com"

    def test_get_me_no_token(self, client):
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401

    def test_get_me_invalid_token(self, client):
        r = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Refresh & Logout
# ---------------------------------------------------------------------------
class TestRefreshLogout:
    def test_refresh_token(self, client, donor_refresh_token):
        r = client.post("/api/v1/auth/refresh", json={"refresh_token": donor_refresh_token})
        assert r.status_code == 200
        assert "access_token" in r.json()["data"]

    def test_logout(self, client, donor_refresh_token, donor_token):
        r = client.post("/api/v1/auth/logout",
                        json={"refresh_token": donor_refresh_token},
                        headers={"Authorization": f"Bearer {donor_token}"})
        assert r.status_code == 200
        # Refresh token now invalid
        r2 = client.post("/api/v1/auth/refresh", json={"refresh_token": donor_refresh_token})
        assert r2.status_code == 401
