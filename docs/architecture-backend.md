# Backend Architecture

The backend of the AI Donation Platform is built using a modern, fully asynchronous Python stack. It handles all business logic, data persistence, input validation, AI inference for object detection, and NLP-based semantic matching. It exposes a versioned REST API consumed by both the web frontend and the Flutter mobile app.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Key Libraries & Responsibilities](#key-libraries--responsibilities)
- [API Endpoint Reference](#api-endpoint-reference)
- [Database Models](#database-models)
- [Services Layer](#services-layer)
- [AI & Machine Learning Modules](#ai--machine-learning-modules)
- [Matching Engine](#matching-engine)
- [Security & Authentication](#security--authentication)
- [Application Startup & Lifespan](#application-startup--lifespan)
- [Core Workflows](#core-workflows)
- [Testing](#testing)
- [Developer Notes & Gotchas](#developer-notes--gotchas)

---

## Directory Structure

```text
backend/
├── app/
│   ├── ai/                       # AI inference layer
│   │   ├── interface.py          # Abstract BaseDetector protocol
│   │   ├── yolo_detector.py      # Ultralytics YOLOv8 inference implementation
│   │   ├── mock_detector.py      # Deterministic fallback detector (no GPU required)
│   │   └── services/             # Detection helper services
│   ├── api/
│   │   └── v1/                   # Versioned API route controllers
│   │       ├── router.py         # Central router — registers all sub-routers
│   │       ├── auth.py           # /auth — Login, registration, token refresh
│   │       ├── donors.py         # /donors — Donor profile management
│   │       ├── donations.py      # /donations — CRUD + lifecycle management
│   │       ├── detection.py      # /detection — Image upload & AI analysis
│   │       ├── ngos.py           # /ngos — NGO profiles, demands
│   │       ├── matching.py       # /matching — Match retrieval & acceptance
│   │       ├── matching_engine.py# /matching-engine — On-demand match triggers
│   │       ├── pickups.py        # /pickups — Pickup slot management
│   │       ├── notifications.py  # /notifications — User notification feeds
│   │       ├── analytics.py      # /analytics — Platform metrics & charts
│   │       └── admin.py          # /admin — Verification, user management
│   ├── core/                     # Cross-cutting concerns
│   │   ├── security.py           # JWT creation/verification, password hashing
│   │   ├── dependencies.py       # FastAPI dependency injectors (get_db, get_current_user)
│   │   ├── exceptions.py         # Custom exception classes & global handlers
│   │   └── middleware.py         # Request logging middleware
│   ├── matching/                 # Matching engine logic
│   │   ├── base.py               # Abstract matcher interface
│   │   ├── engine.py             # Primary matching engine (semantic + rule-based)
│   │   └── weighted_scorer.py    # Multi-attribute weighted scoring logic
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── base.py               # Declarative base + common timestamp mixin
│   │   ├── user.py               # User (auth identity)
│   │   ├── donor.py              # Donor profile
│   │   ├── auth.py               # Refresh token storage
│   │   ├── ngo.py                # NGO profile & verification
│   │   ├── ngo_demand.py         # NGO demand/requirement entries
│   │   ├── donation.py           # Donation + DonationItem records
│   │   ├── match.py              # DonationMatch linking donations to demands
│   │   ├── pickup.py             # Pickup scheduling & tracking
│   │   ├── notification.py       # In-app notification records
│   │   ├── audit_log.py          # Admin audit trail
│   │   └── enums.py              # All shared Enum types
│   ├── schemas/                  # Pydantic v2 request/response schemas (DTOs)
│   ├── services/                 # Business logic layer
│   │   ├── auth_service.py       # Registration, login, token management
│   │   ├── donation_service.py   # Donation creation, lifecycle, packaging
│   │   ├── ngo_service.py        # NGO/demand CRUD and verification workflow
│   │   ├── matching_service.py   # Orchestrates engine, persists matches
│   │   ├── pickup_service.py     # Pickup creation, slot management, status updates
│   │   ├── embedding_service.py  # Sentence-transformer model management
│   │   ├── notification_service.py # In-app + channel notification dispatch
│   │   └── analytics_service.py  # Dashboard metrics & aggregation queries
│   ├── utils/                    # Shared utility helpers
│   ├── config.py                 # Pydantic Settings — all env config in one place
│   ├── database.py               # Async SQLAlchemy session factory
│   └── main.py                   # Application factory & lifespan hooks
├── alembic/                      # Database migration scripts & history
│   └── versions/                 # Auto-generated migration revision files
├── media/                        # Uploaded scan images (served as /media/* static)
├── models/                       # YOLO weight files (e.g., best.pt)
├── tests/                        # Pytest test suite (see Testing section)
├── Dockerfile                    # Multi-stage production Docker image
├── requirements.txt              # Python package dependencies
└── .env.example                  # Environment variable template
```

---

## Key Libraries & Responsibilities

### Web Framework & ASGI Server

| Library | Version | Purpose |
|---|---|---|
| **FastAPI** | ≥ 0.111 | Core async web framework; automatic OpenAPI/Swagger generation |
| **Uvicorn** | — | ASGI server that runs the FastAPI app |
| **python-multipart** | — | Enables `multipart/form-data` file uploads (image scanning) |

> **Why FastAPI?** It was chosen for its native `async/await` support, automatic request/response validation via Pydantic, and zero-boilerplate OpenAPI documentation — which is critical for keeping the mobile and web clients in sync with the API contract.

### Data Validation & Serialization

| Library | Purpose |
|---|---|
| **Pydantic v2** | All `schemas/` DTOs; request body validation; `pydantic-settings` for env config |
| **pydantic-settings** | Typed environment variable loading in `config.py` |

### Database & ORM

| Library | Purpose |
|---|---|
| **SQLAlchemy 2.0 (Async)** | ORM for all database interactions; uses `AsyncSession` throughout |
| **asyncpg** | Async PostgreSQL driver used by SQLAlchemy under the hood |
| **Alembic** | Database schema migration management — run `alembic upgrade head` on deploy |
| **psycopg2-binary** | Synchronous PostgreSQL adapter (used by Alembic CLI only) |

> **Important:** All service-layer database calls use `AsyncSession` with `await`. Never use synchronous session calls in route handlers — it will block the event loop.

### AI & Machine Learning

| Library | Model / Use |
|---|---|
| **Ultralytics (YOLOv8)** | Object detection inference on donor-uploaded images |
| **Sentence-Transformers** | `all-MiniLM-L6-v2` — 384-dimension semantic vector embeddings |
| **PyTorch** | Underlying tensor runtime for both YOLO and Sentence-Transformers |
| **Pillow** | Image preprocessing before YOLO inference |

### Security

| Library | Purpose |
|---|---|
| **python-jose** | JWT token creation and signature verification |
| **passlib (bcrypt)** | Secure password hashing before storage |

---

## API Endpoint Reference

All routes are mounted under the `/api/v1` prefix. The full interactive Swagger UI is available at `http://localhost:8000/docs` when `DEBUG=true`.

| Router File | Prefix | Key Endpoints |
|---|---|---|
| `auth.py` | `/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout` |
| `donors.py` | `/donors` | `GET /me`, `PUT /me`, donor profile management |
| `donations.py` | `/donations` | Full donation CRUD, lifecycle state transitions, packaging guidance |
| `detection.py` | `/detection` | `POST /analyze` — multipart image upload → AI detection response |
| `ngos.py` | `/ngos` | NGO profile, demand creation/management, verification status |
| `matching.py` | `/matching` | Retrieve match results, accept/reject matches |
| `matching_engine.py` | `/matching-engine` | Trigger on-demand matching runs |
| `pickups.py` | `/pickups` | Schedule pickups, update status, driver dispatch |
| `notifications.py` | `/notifications` | Notification feed, mark-as-read |
| `analytics.py` | `/analytics` | Platform-wide metrics and time-series data |
| `admin.py` | `/admin` | NGO verification review, user management, audit logs |

**Standard API Response Envelope:**
```json
{
  "success": true,
  "data": { "..." },
  "message": "Human-readable status message"
}
```
All endpoints return this envelope. Error responses always set `"success": false` with a descriptive `"message"`.

---

## Database Models

The ORM models in `app/models/` map directly to PostgreSQL tables. All models inherit from `Base` in `models/base.py`, which includes `created_at` / `updated_at` auto-timestamp columns.

| Model File | Table(s) | Description |
|---|---|---|
| `user.py` | `users` | Core auth identity (email, hashed password, role) |
| `donor.py` | `donors` | Extended donor profile linked 1:1 to a user |
| `auth.py` | `refresh_tokens` | Stored refresh token hashes for rotation |
| `ngo.py` | `ngos` | NGO profile, contact details, verification status |
| `ngo_demand.py` | `ngo_demands` | Demand entries with category, quantity, urgency, deadline |
| `donation.py` | `donations`, `donation_items` | Donation header + individual item line records |
| `match.py` | `donation_matches` | Links donation items to matched NGO demands with score breakdown |
| `pickup.py` | `pickups` | Pickup scheduling, driver notes, status |
| `notification.py` | `notifications` | In-app notification records per user |
| `audit_log.py` | `audit_logs` | Admin action trail |
| `enums.py` | — | All shared `Enum` types: `UserRole`, `DonationStatus`, `VerificationStatus`, `DemandPriority`, `PickupStatus`, etc. |

---

## Services Layer

The `app/services/` directory is the heart of the backend. Route controllers should be thin — they validate input, call a service, and return the result. All business logic lives in services.

| Service | Responsibility |
|---|---|
| `auth_service.py` | User registration, login credential verification, JWT issuance & refresh token rotation |
| `donation_service.py` | Donation creation from scanned items, status lifecycle transitions, packaging checklist generation |
| `ngo_service.py` | NGO onboarding, demand CRUD, verification workflow state machine |
| `matching_service.py` | Triggers the matching engine, persists `DonationMatch` records, handles acceptance/rejection |
| `pickup_service.py` | Creates pickup slots, manages schedule changes, triggers delivery status updates |
| `embedding_service.py` | Lazy-loads the `all-MiniLM-L6-v2` model on startup, exposes `encode(text)` with fallback |
| `notification_service.py` | Creates in-app notifications; supports pluggable external channel dispatch (email, webhook) |
| `analytics_service.py` | Aggregates donation totals, match rates, NGO impact metrics for dashboard charts |

---

## AI & Machine Learning Modules

### Object Detection (`app/ai/`)

The detection layer follows the **Strategy Pattern** via the abstract `BaseDetector` in `interface.py`.

```
Request → /api/v1/detection/analyze
              │
              ▼
      app.state.detector          ← set at startup via lifespan hook
              │
    ┌─────────┴──────────┐
    │                    │
YOLODetector       MockDetector
(requires best.pt)  (always available)
```

- **`YOLODetector`** — Runs Ultralytics YOLOv8 inference. Returns detected items with bounding boxes, confidence scores, and category labels.
- **`MockDetector`** — Returns a deterministic set of realistic items (books, clothing, electronics). Used when `USE_MOCK_DETECTOR=true` or when YOLO weights fail to load.
- **Fallback:** If `YOLODetector` raises any exception during startup, the lifespan manager automatically activates `MockDetector`. The donor flow is **never interrupted** by AI model failures.

### Semantic Embeddings (`app/services/embedding_service.py`)

- Loads `sentence-transformers/all-MiniLM-L6-v2` on application startup.
- Generates 384-dimension float vectors for donor item descriptions and NGO demand texts.
- If the model fails to load (network or memory issue), the service sets `is_ready = False` and the matching engine falls back to rule-based scoring only.

---

## Matching Engine (`app/matching/`)

The matching engine is invoked by `matching_service.py` and uses a **multi-attribute weighted scoring** approach.

```
engine.py  →  weighted_scorer.py
               │
               ├── Category alignment score    (0.0 – 1.0)
               ├── Quantity compatibility score (0.0 – 1.0)
               ├── Geographic distance fit      (0.0 – 1.0)
               ├── Urgency weight               (0.0 – 1.0)
               └── Semantic similarity (cosine) (0.0 – 1.0)  ← from embedding_service
```

The final score is a weighted sum of all components. Score breakdowns are stored in `donation_matches.score_details` (JSON column) and surfaced in API responses so the frontend can show transparent match explanations to users.

**Fallback:** If `embedding_service` is not ready, the semantic similarity component is replaced with a rule-based keyword overlap score.

---

## Security & Authentication

- **Registration:** Password hashed with `bcrypt` via `passlib` before storage. Plain-text passwords are never persisted.
- **Login:** Returns a short-lived **JWT access token** (default 30 min) and a **refresh token** stored in the database.
- **Token Rotation:** On refresh, the old refresh token is invalidated and a new one issued.
- **RBAC:** `core/dependencies.py` provides `get_current_user`, `require_donor`, `require_ngo`, and `require_admin` dependency injectors applied as FastAPI route dependencies.
- **CORS:** Controlled by `ALLOWED_ORIGINS` env variable. Supports regex-based origin matching for wildcard dev setups.

---

## Application Startup & Lifespan

`app/main.py` uses FastAPI's `@asynccontextmanager` lifespan hook for startup and shutdown logic.

**Startup sequence (in order):**
1. Create `media/` upload directory if not exists.
2. Initialize AI detector (`YOLODetector` or `MockDetector` fallback) → attached to `app.state.detector`.
3. Initialize embedding service → attached to `app.state.embedding_service`.
4. Log startup complete.

**Shutdown:**
Graceful teardown is logged. Database connection pools are released by SQLAlchemy's engine disposal.

> **Note:** Swagger UI (`/docs`), ReDoc (`/redoc`), and OpenAPI spec (`/openapi.json`) are only exposed when `DEBUG=true`. Disable in production.

---

## Core Workflows

### 1. Donation Submission (End-to-End)

```
Donor uploads image
    → POST /api/v1/detection/analyze
    → YOLODetector (or Mock) returns detected items + confidence scores
    → Donor reviews & edits cart in the frontend
    → POST /api/v1/donations (creates Donation + DonationItem records)
    → Matching engine runs automatically on creation
    → DonationMatch records persisted with score breakdowns
    → Donor receives match notifications
```

### 2. NGO Demand & Matching

```
NGO creates demand
    → POST /api/v1/ngos/demands
    → Matching engine runs against existing donations
    → NGO sees ranked match list on dashboard
    → NGO accepts match → PUT /api/v1/matching/{match_id}/accept
    → Pickup is scheduled → POST /api/v1/pickups
    → Status lifecycle: Scheduled → In Transit → Picked Up → Delivered
```

### 3. Admin Verification

```
NGO registers (status = Pending)
    → Admin reviews documents via GET /api/v1/admin/ngos/pending
    → Admin approves/rejects → PUT /api/v1/admin/ngos/{ngo_id}/verify
    → Action recorded in audit_logs table
    → NGO notified of status change
```

---

## Testing

Tests live in `backend/tests/` and use **Pytest** with a test-database setup configured in `conftest.py`.

| Test File | Coverage Area |
|---|---|
| `test_auth.py` | Registration, login, token refresh, RBAC |
| `test_donations.py` | Donation creation, item management, lifecycle states |
| `test_ngos.py` | NGO registration, demand CRUD, verification flow |
| `test_matching.py` | Match creation, acceptance, rejection |
| `test_pickups.py` | Pickup scheduling and status transitions |
| `test_notifications.py` | Notification creation and retrieval |
| `test_semantic_matching.py` | Embedding generation, cosine similarity, fallback scoring |
| `test_yolo_detector.py` | YOLO inference, mock fallback behavior |

**Run tests:**
```bash
# From the backend/ directory with virtual environment activated

# Run all tests
pytest

# Verbose output with stdout captured
pytest -v -s

# Run a specific test file
pytest tests/test_donations.py

# Run with coverage report
pytest --cov=app --cov-report=term-missing
```

---

## Developer Notes & Gotchas

**Always run Alembic after model changes.**
If you add or modify a SQLAlchemy model, generate a migration:
```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

**The `DEBUG` flag gates Swagger UI.**
Set `DEBUG=true` in your `.env` during development to access `/docs`. It is intentionally disabled in production builds.

**MockDetector is your friend.**
If you don't have YOLO weights (`best.pt`), set `USE_MOCK_DETECTOR=true`. The donor flow works identically with realistic mock data.

**Async all the way.**
All service functions are `async def` and all DB queries use `await session.execute(...)`. Mixing sync and async SQLAlchemy calls will cause deadlocks.

**bcrypt warning is cosmetic.**
A `warnings.filterwarnings` suppress at the top of `main.py` silences a known false-positive bcrypt version detection message. bcrypt hashing functions correctly.

**Media files** are served as static assets at `/media/*`. The directory is created automatically on startup. In production, serve this directory via Nginx for performance.
