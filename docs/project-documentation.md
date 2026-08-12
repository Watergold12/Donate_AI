# Project Documentation

This document captures the complete, production-ready state of the AI Donation Management Platform — its architecture, feature set, system workflows, and implementation decisions. It is the primary reference for all developers joining or contributing to the project.

---

## Table of Contents

- [System Overview](#system-overview)
- [Platform Components](#platform-components)
- [Core Features](#core-features)
- [Core Workflows](#core-workflows)
- [API Areas](#api-areas)
- [Database Schema Overview](#database-schema-overview)
- [AI & Matching System](#ai--matching-system)
- [Notification System](#notification-system)
- [Configuration Summary](#configuration-summary)
- [Validation & Testing Approach](#validation--testing-approach)
- [Known Open Items](#known-open-items)

---

## System Overview

The AI Donation Management Platform is an end-to-end system that bridges individual donors with Non-Governmental Organizations (NGOs) in need of physical goods. The platform replaces slow, manual donation sorting processes with AI-powered item detection and intelligent semantic matching.

```
┌────────────────────────┐    ┌────────────────────────┐
│   React 19 Web App     │    │  Flutter Mobile App     │
│   (Donor / NGO / Admin)│    │  (Donor / NGO)          │
└──────────┬─────────────┘    └───────────┬─────────────┘
           │  REST / JSON                  │  REST / JSON
           └──────────────┬───────────────┘
                          ▼
             ┌────────────────────────┐
             │   FastAPI Backend      │
             │   /api/v1/*            │
             └──────┬────────┬────────┘
                    │        │
         ┌──────────┘        └────────────┐
         ▼                                ▼
┌─────────────────┐            ┌─────────────────────┐
│  AI Inference   │            │  PostgreSQL Database │
│  ─ YOLOv8       │            │  ─ Users & Profiles  │
│  ─ MiniLM-L6-v2 │            │  ─ Donations & Items │
└─────────────────┘            │  ─ NGOs & Demands    │
                               │  ─ Matches & Pickups │
                               │  ─ Notifications     │
                               └─────────────────────┘
```

---

## Platform Components

The platform is split into **three deployable parts** and a shared backend:

| Component | Technology | Location | Audience |
|---|---|---|---|
| **Backend API** | Python 3.11 + FastAPI | `backend/` | Powers all clients |
| **Web Frontend** | React 19 + TypeScript (Vite) | `frontend/` | Donors, NGOs, Admins |
| **Mobile App** | Flutter / Dart (Android + iOS) | `mobile_frontend/` | Donors, NGOs (on-the-go) |

All three components share the same backend API. There is no separate mobile API — the Flutter app hits the same `/api/v1/*` endpoints as the web app.

For deep-dive technical documentation on each component, see:
- [Backend Architecture](architecture-backend.md)
- [Frontend Web Architecture](architecture-frontend.md)
- [Mobile App Architecture](architecture-mobile.md)

---

## Core Features

### 1. AI-Powered Item Detection
Donors upload or capture an image of items they wish to donate. The backend runs YOLOv8 object detection to automatically identify and catalog items (books, clothing, electronics, appliances, sports equipment, etc.), returning category labels, confidence scores, bounding boxes, and quantity estimates. A `MockDetector` fallback ensures the donor flow is never blocked if model weights are unavailable.

### 2. Intelligent Semantic Matching
When a donation is created or an NGO publishes a demand, the matching engine runs a **multi-attribute weighted scoring** algorithm:
- **Category alignment** — does the donated item match what the NGO needs?
- **Quantity compatibility** — can the supply meet the demand?
- **Geographic distance** — are donor and NGO within reasonable proximity?
- **Urgency weight** — how critical is the NGO's need?
- **Semantic similarity** — NLP vector comparison of donor item descriptions vs. NGO demand text using `sentence-transformers/all-MiniLM-L6-v2`

Score breakdowns are stored and surfaced to users for full transparency.

### 3. NGO Registry & Demand Management
NGOs register with mission details, contact info, and license IDs. A multi-tier admin verification workflow manages `Pending → Verified → Rejected` status. Verified NGOs can publish demand requests with priority levels (`Low`, `Medium`, `High`, `Critical`), required quantities, item categories, and delivery deadlines.

### 4. Donation Lifecycle & Pickup Logistics
End-to-end flow: item scanning → cart review → AI matching → pickup scheduling. The status pipeline tracks `Scheduled → In Transit → Picked Up → Delivered → Cancelled`. Donors receive packaging checklists and can track their donation's journey in real time.

### 5. Role-Based Dashboards & Analytics
- **Donor Dashboard:** Scanner access, active pickup tracker, donation history, eco-impact metrics (CO₂ reduction, landfill diversion).
- **NGO Dashboard:** Demand creation, AI match recommendations feed, acceptance flow, fulfillment statistics.
- **Admin Dashboard:** System-wide monitor, NGO verification queue, user management, platform performance metrics.

### 6. Authentication & Security
JWT-based authentication with `bcrypt` password hashing and refresh token rotation. Full Role-Based Access Control (RBAC) separates `Donor`, `NGO`, and `Admin` access scopes. All API responses use a standardized envelope (`{ success, data, message }`).

### 7. Notification System
In-app notification persistence for all key lifecycle events (match found, match accepted, pickup scheduled, delivery complete). The notification service is designed for future external channel expansion (email, SMS, webhook).

---

## Core Workflows

### Donor Flow

```
1. Register / Login (role = donor)
2. Open Camera Scanner (web or mobile)
3. Capture or upload item image
4. AI detection returns item list with confidence scores
5. Review detected items in cart — edit quantities, add descriptions, remove items
6. Submit donation → backend creates Donation + DonationItem records
7. Matching engine runs automatically → match candidates surfaced
8. Review packaging checklist & acknowledgement step
9. Schedule pickup — select slot, address, special instructions
10. Track status: Scheduled → In Transit → Picked Up → Delivered
```

### NGO Flow

```
1. Register NGO profile (role = ngo)
2. Submit to admin verification (upload license/documents)
3. Wait for Verified status
4. Create demands: item category, quantity, urgency, deadline
5. Receive AI match recommendations on dashboard
6. Accept or reject candidate matches
7. Track pickup and completion status
8. View analytics: match rates, fulfillment volume, demand history
```

### Admin Flow

```
1. Login (role = admin)
2. Review NGO verification queue (Pending submissions)
3. Approve or reject NGO applications (recorded in audit log)
4. Monitor system-wide donation and match activity
5. Manage user accounts if needed
6. View platform performance metrics
```

---

## API Areas

The backend REST API (`/api/v1/`) is organized into the following route groups:

| Route Group | Prefix | Description |
|---|---|---|
| **Authentication** | `/auth` | Register, login, token refresh, logout |
| **Donors** | `/donors` | Donor profile management |
| **Donations** | `/donations` | Donation CRUD, lifecycle state management |
| **Detection** | `/detection` | AI image analysis endpoint |
| **NGOs** | `/ngos` | NGO profiles, demand creation, demand management |
| **Matching** | `/matching` | Match retrieval, acceptance, rejection |
| **Matching Engine** | `/matching-engine` | On-demand match trigger |
| **Pickups** | `/pickups` | Pickup scheduling and status tracking |
| **Notifications** | `/notifications` | Notification feed, mark-as-read |
| **Analytics** | `/analytics` | Platform metrics and time-series data |
| **Admin** | `/admin` | NGO verification, user management, audit logs |

Interactive API documentation (Swagger UI) is accessible at `http://localhost:8000/docs` when the backend is running with `DEBUG=true`.

---

## Database Schema Overview

The PostgreSQL database is managed via **Alembic** migrations. The following tables exist:

| Table | Description |
|---|---|
| `users` | Core auth identity — email, hashed password, role |
| `donors` | Donor profile extended from users (1:1) |
| `refresh_tokens` | Stored token hashes for JWT rotation |
| `ngos` | NGO profile, contact, verification status |
| `ngo_demands` | Demand records: category, quantity, urgency, deadline |
| `donations` | Donation headers with overall lifecycle status |
| `donation_items` | Individual item lines per donation (category, qty, description) |
| `donation_matches` | Links donation items to NGO demands; stores weighted score breakdown |
| `pickups` | Pickup records: slot, address, driver notes, delivery status |
| `notifications` | In-app notification records per user |
| `audit_logs` | Admin action trail for accountability |

All models include `created_at` and `updated_at` auto-managed timestamp columns.

---

## AI & Matching System

### Object Detection

The detection layer uses a **Strategy Pattern** with two implementations:

- **YOLODetector** — Ultralytics YOLOv8 inference on uploaded images. Requires `models/best.pt` weights file.
- **MockDetector** — Deterministic fake detector. Returns realistic item categories (books, clothing, electronics) without any model weights. Always available.

Set `USE_MOCK_DETECTOR=true` in `.env` to always use MockDetector. If `USE_MOCK_DETECTOR=false` and YOLO fails to load, the system automatically falls back to MockDetector — **the donor workflow is never blocked**.

### Semantic Matching

The matching engine in `app/matching/` uses `sentence-transformers/all-MiniLM-L6-v2` to generate 384-dimension float vector embeddings. Cosine similarity between donor item and NGO demand embeddings forms the semantic component of the match score.

The final match score is a weighted combination:
```
final_score = w1 * category_score
            + w2 * quantity_score
            + w3 * distance_score
            + w4 * urgency_score
            + w5 * semantic_similarity
```

If the embedding service fails to load, the semantic component falls back to keyword overlap scoring. All other scoring components continue normally.

---

## Notification System

Notifications are created by `notification_service.py` and persisted to the `notifications` table. Key trigger events:
- New donation match found
- Match accepted or rejected by NGO
- Pickup scheduled
- Pickup status changed (in transit, delivered)
- NGO verification status changed

The service is designed with channel abstraction — in-app delivery is the default, with optional external channels (email, webhook) configurable via environment variables. Future channel additions (SMS, push notifications) can be added without modifying existing trigger logic.

---

## Configuration Summary

Environment variables for each component are documented in their respective `.env.example` files:
- `backend/.env.example` — all backend settings
- `frontend/.env.example` — all frontend settings

### Backend Key Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret (64+ random chars) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token lifetime (default: 30 min) |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins |
| `USE_MOCK_DETECTOR` | `true` to skip YOLO, use deterministic mock |
| `DETECTION_CONFIDENCE` | Minimum YOLO confidence threshold (default: 0.40) |
| `MODEL_PATH` | Path to YOLO weights file |
| `DEBUG` | `true` enables Swagger UI at `/docs` |

### Frontend Key Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g., `http://localhost:8000/api/v1`) |

---

## Validation & Testing Approach

### Backend Tests (Pytest)

Located in `backend/tests/`. Test files cover:
- `test_auth.py` — Registration, login, RBAC
- `test_donations.py` — Donation CRUD and lifecycle states
- `test_ngos.py` — NGO registration, demand management, verification
- `test_matching.py` — Match creation and acceptance/rejection
- `test_pickups.py` — Pickup scheduling and status tracking
- `test_notifications.py` — Notification creation and retrieval
- `test_semantic_matching.py` — Embedding service and cosine similarity
- `test_yolo_detector.py` — YOLO and mock fallback behavior

```bash
# From backend/ directory with venv activated:
pytest -v -s
```

### Frontend Validation

```bash
# From frontend/ directory:
npm run build   # TypeScript compile + Vite bundle (surfaces type errors)
npm run lint    # ESLint validation
```

### AI Module Validation

The embedding service and YOLO detector are initialized at startup. Startup logs confirm which detector and model loaded successfully. Check terminal output for:
```
AI detector: YOLODetector loaded from ./models/best.pt
Semantic embedding service ready: all-MiniLM-L6-v2
```
or their fallback equivalents if models are unavailable.

---

## Known Open Items

The following items are intentionally open for future development:

- **End-to-end integration testing** — Full workflow tests across the entire stack (donor upload → NGO match → pickup completion).
- **Backend load & stress testing** — Performance validation under concurrent donation submissions and matching runs.
- **Cross-browser validation** — Thorough compatibility and performance testing across major browsers.
- **Cloud deployment** — Production deployment of the full platform (backend, frontend, database, media storage) to a cloud provider.
- **Mobile push notifications** — External push notification channel for the Flutter app (Firebase Cloud Messaging or APNs).
- **Real-time updates** — WebSocket or Server-Sent Events for live dashboard updates without polling.
