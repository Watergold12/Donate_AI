"""
Shared pytest fixtures for the Donation Management System test suite.

Strategy:
- One PostgreSQL test database (donation_test_db) — requires it to exist before running tests.
- Session-scoped engine + schema: tables created once per pytest session, dropped after.
- Function-scoped transaction: each test runs inside a SAVEPOINT that is always rolled back,
  keeping tests fully isolated without recreating the schema.

Set TEST_DATABASE_URL env var or add to backend/.env.test:
  TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/donation_test_db
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session

# Import all models so their metadata is registered before create_all
from app.models import (  # noqa: F401
    User, RefreshToken, DonorProfile, NGOProfile,
    Donation, DonationItem, NGODemand, Match,
    PickupRequest, Notification, AuditLog, Base,
)
from app.models.enums import UserRole
from app.database import get_db
from app.main import app

# ---------------------------------------------------------------------------
# Test database URL — override via env var or .env.test
# ---------------------------------------------------------------------------
TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/donation_test_db",
)


# ---------------------------------------------------------------------------
# Session-scoped engine + tables
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def test_engine():
    """Create engine and build schema once per pytest session."""
    engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="session")
def session_factory(test_engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# ---------------------------------------------------------------------------
# Function-scoped DB session with savepoint rollback
# ---------------------------------------------------------------------------
@pytest.fixture()
def db(test_engine, session_factory) -> Session:
    """
    Per-test DB session that wraps everything in a SAVEPOINT.
    The SAVEPOINT is always rolled back after the test — zero data leaks between tests.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = session_factory(bind=connection)
    session.begin_nested()  # SAVEPOINT

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# TestClient with overridden get_db
# ---------------------------------------------------------------------------
@pytest.fixture()
def client(db: Session) -> TestClient:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------
def register_and_login(client: TestClient, email: str, password: str, role: str,
                       extra: dict = None) -> dict:
    """Register a user and return {"access_token": ..., "refresh_token": ...}."""
    payload = {"email": email, "password": password, "full_name": f"Test {role.title()}", "role": role}
    if extra:
        payload.update(extra)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201, f"Register failed ({r.status_code}): {r.text}"
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed ({r.status_code}): {r.text}"
    return r.json()["data"]


@pytest.fixture()
def donor_token(client: TestClient) -> str:
    data = register_and_login(client, "donor@test.com", "Donor1234!", "donor")
    return data["access_token"]


@pytest.fixture()
def donor_refresh_token(client: TestClient) -> str:
    data = register_and_login(client, "donor2@test.com", "Donor1234!", "donor")
    return data["refresh_token"]


@pytest.fixture()
def ngo_token(client: TestClient) -> str:
    data = register_and_login(
        client, "ngo@test.com", "Ngo12345!", "ngo",
        extra={"org_name": "Test NGO", "registration_number": "NGO-TEST-001"},
    )
    return data["access_token"]


@pytest.fixture()
def admin_token(client: TestClient, db: Session) -> str:
    """Admin users cannot self-register — insert directly, then login."""
    from app.core.security import hash_password
    admin = User(
        email="admin@test.com",
        password_hash=hash_password("Admin1234!"),
        full_name="Test Admin",
        role=UserRole.admin,
        is_active=True,
        is_verified=True,
    )
    db.add(admin)
    db.flush()
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "Admin1234!"})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["data"]["access_token"]
