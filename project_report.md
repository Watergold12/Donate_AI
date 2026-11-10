# AI-BASED DONATION MANAGEMENT SYSTEM FOR INTELLIGENT RESOURCE MATCHING & DISTRIBUTION

**Submitted in partial fulfillment of the requirements for the Springboard Internship (2026)**

**Submitted by:** [Your Name]
**Guide / Mentor:** [Mentor Name]
**Institution / Organisation:** Infosys Springboard

---

## ABSTRACT

Physical donation management—the process of connecting donors with Non-Governmental Organizations (NGOs) that have immediate resource needs—has historically been an inefficient, manual, and opaque process. Items are often misdirected, NGO demands go unmet, and there is no mechanism to prioritize urgent requirements. This project presents an end-to-end, AI-powered donation management platform that bridges the gap between donors and NGOs using two key AI subsystems: (1) computer vision for automated item cataloging via a browser camera stream, and (2) natural language processing (NLP) with vector-based semantic search for intelligent resource matching.

The backend is built on FastAPI with an async PostgreSQL database, while the frontend is a React 19 and TypeScript single-page application. A YOLOv8 object detection model analyzes live camera images to automatically identify and categorize donation items (books, clothing, electronics, furniture, toys, and more) with confidence scores and bounding boxes. A weighted matching engine—powered by Sentence Transformers (`all-MiniLM-L6-v2`)—then evaluates category alignment, quantity compatibility, geographic proximity, urgency weight, and semantic similarity between donor offerings and NGO demand requests. The platform supports full role-based access control (RBAC) for Donors, NGOs, and Administrators, and exposes a transparent match score breakdown with natural-language explanations.

**Keywords:** Donation management, computer vision, YOLOv8, object detection, NLP, semantic matching, vector embeddings, sentence-transformers, FastAPI, React, NGO, RBAC, resource distribution.

---

## TABLE OF CONTENTS

1. [Introduction](#chapter-1--introduction)
2. [Literature Survey / Existing System](#chapter-2--literature-survey--existing-system)
3. [Proposed System](#chapter-3--proposed-system)
4. [System Requirements](#chapter-4--system-requirements)
5. [System Architecture and Design](#chapter-5--system-architecture-and-design)
6. [Dataset and Data Preparation](#chapter-6--dataset-and-data-preparation)
7. [Implementation](#chapter-7--implementation)
8. [Evaluation Metrics](#chapter-8--evaluation-metrics)
9. [Results and Discussion](#chapter-9--results-and-discussion)
10. [Conclusion and Future Work](#chapter-10--conclusion-and-future-work)
11. [Testing](#chapter-11--testing)

- [Appendix A – Algorithm Details](#appendix-a--algorithm-details)
- [Appendix B – Test Cases and Acceptance Checklist](#appendix-b--test-cases-and-acceptance-checklist)
- [Appendix C – Environment Configuration Reference](#appendix-c--environment-configuration-reference)
- [Appendix D – Glossary](#appendix-d--glossary)
- [References](#references)

---

## LIST OF FIGURES

- Figure 5.1: Overall system architecture (three-tier layered model)
- Figure 5.2: End-to-end donation data flow
- Figure 5.3: Module interaction diagram
- Figure 6.1: YOLOv8 item detection pipeline
- Figure 7.1: Weighted matching engine scoring flow
- Figure 7.2: Semantic embedding similarity computation
- Figure 9.1: Donor dashboard screenshot
- Figure 9.2: Camera-scan and item cart screenshot
- Figure 9.3: NGO demand management and match feed screenshot
- Figure 9.4: Admin dashboard screenshot

---

## LIST OF TABLES

- Table 4.1: Existing approach vs. proposed approach
- Table 4.2: Functional requirements
- Table 4.3: Non-functional requirements
- Table 4.4: Hardware and software requirements
- Table 5.1: System module responsibilities
- Table 6.1: Detectable item categories and YOLO class mapping
- Table 6.2: Data quality and validation checks
- Table 8.1: Evaluation metrics
- Table 10.1: Matching score component weights
- Table 11.1: Functional test cases
- Table 11.2: Risks and mitigation actions

---

## LIST OF ABBREVIATIONS

| Abbreviation | Full Form                         |
| ------------ | --------------------------------- |
| AI           | Artificial Intelligence           |
| API          | Application Programming Interface |
| CORS         | Cross-Origin Resource Sharing     |
| CRUD         | Create, Read, Update, Delete      |
| CV           | Computer Vision                   |
| DTO          | Data Transfer Object              |
| JWT          | JSON Web Token                    |
| NGO          | Non-Governmental Organization     |
| NLP          | Natural Language Processing       |
| ORM          | Object Relational Mapper          |
| RBAC         | Role-Based Access Control         |
| REST         | Representational State Transfer   |
| SPA          | Single Page Application           |
| SQL          | Structured Query Language         |
| YOLO         | You Only Look Once                |

---

## CHAPTER 1 — INTRODUCTION

### Background and Context

Physical donations—clothing, books, electronics, furniture, medical supplies, food, and toys—represent a vital lifeline for underserved communities and disaster-affected populations served by NGOs. Despite genuine intent from donors, the logistics and intelligence required to route donations effectively are often absent. Donations arrive unsorted, in wrong quantities, and to the wrong organizations. NGOs, on the other hand, struggle to communicate their real-time, prioritized needs to a dispersed donor base.

Modern machine learning offers two powerful tools to transform this process. First, object detection models can analyze images of physical items and automatically catalog what they contain, removing the need for donors to manually describe or classify their items. Second, semantic embedding models can measure the contextual similarity between a donor's item descriptions and an NGO's demand specifications, going beyond simple keyword matching to understand intent and context.

This project combines both capabilities into a unified, full-stack web platform.

### Problem Statement

The core problem addressed by this project is: physical donation management lacks intelligence and transparency. Donors do not know which NGO needs their specific items most urgently; NGOs do not have an effective channel to broadcast structured, prioritized demands; and neither party has visibility into the end-to-end status of a donation lifecycle.

Given these constraints, how can an AI-powered platform automate item recognition, rank NGO-donor pairings by relevance, and provide full lifecycle tracking from item scan to confirmed delivery?

### Need for the Project

1. **Donor friction is a barrier to giving.** Manual item cataloging discourages casual donors. A camera-based scan that auto-identifies items in seconds lowers the barrier to entry dramatically.
2. **NGO demand is poorly communicated.** NGOs have no structured portal to publish item demands with urgency levels, quantity targets, and category specifications. This creates mismatches between supply and need.
3. **Matching is currently manual and arbitrary.** Without a scoring engine, donation routing relies on personal contacts, phone calls, or first-come-first-served assignment—all inefficient and opaque.
4. **Transparency builds trust.** Donors who can track their donation from pickup to delivery are more likely to donate again. NGOs that receive relevant, timely donations are more likely to re-engage with the platform.

### Objectives

The overall objective is to design, build, and validate a full-stack AI donation management platform. Specific objectives are:

- Implement a browser-based camera pipeline using the HTML5 MediaDevices API to capture live images of donor items.
- Integrate a YOLOv8 object detection model to identify, classify, and count donation items automatically.
- Build a rule-and-NLP-based weighted matching engine that scores donor donations against NGO demand requests across six dimensions: item type, quantity, priority, distance, urgency, and semantic similarity.
- Implement a full NGO registry with multi-tier verification, demand management, and match acceptance workflows.
- Build a Donor portal with an item cart, AI match recommendations, and pickup scheduling.
- Implement an Administrator portal for user management, NGO verification, and platform analytics.
- Secure all endpoints with Role-Based Access Control (RBAC), JWT authentication, and bcrypt password hashing.
- Design the system for production deployment with Docker containerization, Alembic schema migrations, and configurable environments.

### Scope of the Project

The scope includes the design and implementation of a three-role, three-tier web application with:

- A **computer vision** subsystem (YOLOv8 + fallback `MockDetector`) for physical item recognition.
- An **NLP matching** subsystem (`sentence-transformers/all-MiniLM-L6-v2` + rule-based fallback) for intelligent resource pairing.
- An **asynchronous REST API** (FastAPI + SQLAlchemy async) as the application backend.
- A **React 19 SPA** (TypeScript, Tailwind CSS, React Router, React Hook Form, Zod, Recharts) as the web frontend.
- A **Flutter cross-platform mobile app** as an additional client for donor camera workflows.
- A **PostgreSQL** relational database with Alembic migration management.
- A **Docker** container image for backend production deployment.

The report covers the rationale, architecture, implementation modules, evaluation approach, and known limitations. It does not claim that the platform has been deployed at production scale or tested with real NGO partners beyond the demonstration environment.

---

## CHAPTER 2 — LITERATURE SURVEY / EXISTING SYSTEM

### Overview of Existing Approaches

Several existing platforms attempt to address donation logistics:

- **GoFundMe / JustGiving**: Primarily monetary donation platforms; no physical item tracking.
- **VolunteerMatch / Idealist**: Connect volunteers to NGOs; no AI item matching.
- **Manual NGO intake processes**: NGOs publish wishlists on social media; donors call to coordinate. Error-prone, slow, and unscalable.
- **Food bank software (Link2Feed, Pantry Soft)**: Specialized for food; limited AI; no camera-based catalog.

### Gap Analysis — Table 4.1: Existing Approach vs. Proposed Approach

| Aspect                | Existing Systems                | This Project                                     |
| --------------------- | ------------------------------- | ------------------------------------------------ |
| Item identification   | Manual input by donor           | Automated via YOLOv8 camera scan                 |
| NGO demand expression | Free-text social media posts    | Structured demand registry with urgency/priority |
| Matching logic        | Manual, first-come-first-served | AI-weighted scoring with NLP semantic similarity |
| Match transparency    | None                            | Granular score breakdown per dimension           |
| Lifecycle tracking    | None to minimal                 | Full status pipeline: Draft to Delivered         |
| Role-based portals    | Typically single-role           | Donor, NGO, Admin portals with RBAC              |
| Mobile access         | Rarely                          | Flutter cross-platform mobile app                |

### Relevant Research

- **Redmon et al. (2016)** — You Only Look Once (YOLO): Unified, Real-Time Object Detection. Established the real-time single-shot detection paradigm used via Ultralytics YOLOv8.
- **Reimers and Gurevych (2019)** — Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. Foundation for the `sentence-transformers` library and `all-MiniLM-L6-v2`.
- **Devlin et al. (2019)** — BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. Contextual embeddings that power the MiniLM model lineage.
- **FastAPI documentation** — Reference for async Python API development with automatic OpenAPI schema generation.

---

## CHAPTER 3 — PROPOSED SYSTEM

### System Overview

The proposed system is an AI-powered donation management platform comprising four main subsystems:

1. **Camera and Vision Subsystem**: A browser camera stream feeds live images to a FastAPI endpoint. The YOLOv8 model detects objects, extracts class names, confidence scores, bounding boxes, and counts. Results are mapped to the platform's `ItemCategory` enum (`clothing`, `books`, `electronics`, `furniture`, `food`, `toys`, `medical`, `other`). A `MockDetector` fallback guarantees uninterrupted operation if model weights are unavailable.
2. **Matching Engine Subsystem**: When a donor submits a donation, the system queries the NGO demand registry and scores each candidate demand using the `WeightedScorer`. Six criteria are evaluated with configurable weights (item_type 25%, quantity 20%, urgency 15%, semantic 15%, priority 15%, distance 10%). Semantic similarity is computed as the cosine similarity of `all-MiniLM-L6-v2` embeddings. The top-N matches (default: 3) above a score threshold (default: 0.50) are proposed to the NGO.
3. **NGO and Demand Management Subsystem**: NGOs register with mission details and service area tags. An administrator reviews and approves NGO profiles. Verified NGOs publish demands with item category, quantity needed, urgency level (`low`, `medium`, `high`, `critical`), and a deadline. Match acceptance triggers the donation status pipeline.
4. **Pickup Logistics Subsystem**: Upon match acceptance, a pickup is scheduled with a date, donor address, and special instructions. A full status pipeline tracks the item from `pickup_scheduled` through `in_transit`, `collected`, and `delivered`.

### Advantages Over Existing Systems

- **Zero-friction donor onboarding** via camera scan (no manual categorization required).
- **Transparent, explainable matching** with per-dimension score breakdowns and human-readable explanations.
- **Production-grade security** with RBAC, JWT, bcrypt, CORS filtering, and input validation.
- **Graceful AI degradation**: both the YOLO detector and the embedding model have rule-based fallbacks.

---

## CHAPTER 4 — SYSTEM REQUIREMENTS

### Functional Requirements

**Table 4.2: Functional Requirements**

| ID    | Requirement                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | The system shall allow donors to register, log in, and manage their profile.                                                          |
| FR-02 | The system shall allow a donor to initiate a camera-based item scan from the browser.                                                 |
| FR-03 | The system shall analyze the captured image using YOLOv8 and return detected items with categories and confidence scores.             |
| FR-04 | The system shall allow a donor to review, edit quantities, add notes, and confirm or remove items in an interactive cart.             |
| FR-05 | The system shall allow a donor to submit a donation and receive AI-generated NGO match recommendations.                               |
| FR-06 | The system shall allow NGOs to register, publish demand requests, and view incoming match proposals.                                  |
| FR-07 | The system shall allow NGOs to accept or reject match proposals with optional rejection reasons.                                      |
| FR-08 | The system shall allow administrators to verify or reject NGO registrations.                                                          |
| FR-09 | The system shall provide an admin dashboard with platform-wide analytics.                                                             |
| FR-10 | The system shall track the full donation lifecycle (Draft to Delivered).                                                              |
| FR-11 | The system shall display per-match score breakdowns (item type %, quantity %, urgency weight, distance score, semantic similarity %). |
| FR-12 | The system shall send in-app notifications for key events (match found, match accepted, pickup scheduled).                            |
| FR-13 | The system shall enforce role-based access control: donors cannot access NGO or admin routes, and vice versa.                         |
| FR-14 | The system shall expose a `/health` endpoint for operational monitoring.                                                            |

### Non-Functional Requirements

**Table 4.3: Non-Functional Requirements**

| ID     | Requirement                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | **Security**: All passwords stored with bcrypt. All protected endpoints require a valid JWT.                                          |
| NFR-02 | **Reliability**: AI detector and embedding service both have rule-based fallbacks so core workflows are never blocked.                |
| NFR-03 | **Scalability**: Async I/O throughout the FastAPI backend ensures non-blocking database operations.                                   |
| NFR-04 | **Usability**: Frontend built with Tailwind CSS glassmorphism design system; responsive layout.                                       |
| NFR-05 | **Reproducibility**: All environment settings managed via `.env`; Docker image provides reproducible deployment.                    |
| NFR-06 | **Auditability**: An `AuditLog` table records every create, update, delete, login, verify, match, accept, reject, and cancel event. |
| NFR-07 | **Privacy**: Donor PII is stored in a dedicated `DonorProfile` table with restricted read access.                                   |

### Hardware and Software Requirements

**Table 4.4: Hardware and Software Requirements**

| Component              | Requirement                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend Runtime        | Python 3.11+                                                                                                                       |
| Database               | PostgreSQL 14+                                                                                                                     |
| Frontend Runtime       | Node.js 18.x / 20.x, npm 9+                                                                                                        |
| Browser                | Any modern browser with MediaDevices API (Chrome 72+, Firefox 68+, Safari 13+)                                                     |
| AI (CPU)               | 4-core CPU, 8 GB RAM (YOLO inference slower but functional)                                                                        |
| AI (GPU)               | NVIDIA GPU with CUDA support (significantly faster YOLO inference)                                                                 |
| Containerization       | Docker Engine 24+                                                                                                                  |
| Key Backend Libraries  | FastAPI 0.111.0, SQLAlchemy 2.0.30, Alembic 1.13.1, Ultralytics 8.3.168, sentence-transformers 3.0.1, pydantic 2.7.1, bcrypt 4.0.1 |
| Key Frontend Libraries | React 19.2.7, TypeScript 6.0, Vite 7, Tailwind CSS 4, React Router 7, React Hook Form 7, Zod 4, Recharts 3, Axios 1                |

### Requirements Traceability

| Project Goal          | Platform Feature                      | Verification Method                                        |
| --------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Reduce donor friction | Camera scan + auto-catalog            | Unit test: YOLO endpoint returns detections for test image |
| Express NGO needs     | Demand registry with urgency/quantity | Integration test: NGO demand CRUD                          |
| Match intelligently   | WeightedScorer + semantic similarity  | Unit test: score correctness for known inputs              |
| Ensure transparency   | Score breakdown in API response       | API response schema validation                             |
| Track lifecycle       | DonationStatus enum pipeline          | Integration test: status transitions                       |
| Secure access         | RBAC + JWT                            | Auth test: cross-role access returns HTTP 403              |

---

## CHAPTER 5 — SYSTEM ARCHITECTURE AND DESIGN

### Overall System Architecture

The platform follows a three-tier layered architecture:

```
+----------------------------------+
|     Presentation Layer           |
|  React 19 SPA (Vite + Tailwind)  |
|  Flutter Mobile App              |
+----------------+-----------------+
                 |  REST API (JSON / HTTP)
                 v
+----------------------------------+
|     Application Layer            |
|     FastAPI Backend              |
|   +-----------+  +-----------+   |
|   | AI Engine |  | Matching  |   |
|   | (YOLOv8)  |  | Engine    |   |
|   +-----------+  +-----------+   |
+----------------+-----------------+
                 |  SQLAlchemy Async
                 v
+----------------------------------+
|      Data Layer                  |
|     PostgreSQL 14+               |
|  Tables: users, donors, ngos,    |
|  donations, matches, pickups,    |
|  demands, notifications, audit   |
+----------------------------------+
```

*Figure 5.1: Overall system architecture (three-tier layered model)*

**Table 5.1: System Module Responsibilities**

| Layer             | Responsibility                                                               |
| ----------------- | ---------------------------------------------------------------------------- |
| Presentation      | Render UI, validate forms, manage routing, call REST API                     |
| Application (API) | Route requests, enforce auth, orchestrate business logic, call AI subsystems |
| AI Engine         | Run YOLO inference, compute semantic embeddings, score matches               |
| Data              | Persist entities, enforce constraints, manage schema migrations              |

### End-to-End Data Flow

The donation lifecycle data flow proceeds as follows:

1. Donor opens camera scan — Browser captures image frame via `MediaDevices.getUserMedia()`.
2. Image posted to `/api/v1/detection/scan` — FastAPI receives multipart upload.
3. YOLOv8 runs inference — Returns detections: name, category, confidence, count, bbox.
4. Donor reviews item cart — Edits quantities and notes; submits donation.
5. POST `/api/v1/donations/` — Donation record created (status = draft then pending).
6. Matching engine invoked — `WeightedScorer` evaluates all eligible NGO demands. Top-N matches above threshold persisted in the `matches` table (status = proposed).
7. Donation status updates to `matched`. Notifications dispatched to matched NGOs.
8. NGO accepts match — match status = accepted; donation status = accepted.
9. Pickup is scheduled — `PickupRequest` created; donor receives packaging checklist; status = `pickup_scheduled`.
10. Driver collects items — Status transitions: collected, delivered, completed.

*Figure 5.2: End-to-end donation data flow*

### Module Interaction

```
[Auth Module]        [Donor Module]      [NGO Module]       [Admin Module]
     |                     |                  |                    |
     +--JWT issue-------->+|                  |                    |
                           |--POST /donations->[Donation Service]  |
                           |                       |               |
                           |               [Matching Engine]       |
                           |               [Embedding Service]     |
                           |                       |               |
                           |               [Match Record]------>[NGO Notification]
                           |<--Match Proposals--[NGO Dashboard]    |
                           |                  [Accept Match]       |
                           |               [Pickup Service]        |
                           |<--Packaging Checklist---              |
```

*Figure 5.3: Module interaction diagram*

### Database Schema Design

The PostgreSQL schema consists of 11 core tables:

| Table               | Key Columns                                                                   | Relationships                               |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| `users`           | id, email, hashed_password, role                                              | 1:1 donor_profiles or ngo_profiles          |
| `donor_profiles`  | id, user_id, city, state, address                                             | 1:N donations                               |
| `ngo_profiles`    | id, user_id, verified, service_areas                                          | 1:N ngo_demands, 1:N matches<br />          |
| `donations`       | id, donor_id, status, total_items                                             | 1:N donation_items, 1:N matches, 1:1 pickup |
| `donation_items`  | id, donation_id, category, quantity, ai_detected, confidence_score            | N:1 donations                               |
| `ngo_demands`     | id, ngo_id, item_category, urgency_level, quantity_needed, quantity_fulfilled | 1:N matches                                 |
| `matches`         | id, donation_id, ngo_demand_id, ngo_id, score, status                         | links donations to NGO demands              |
| `pickup_requests` | id, match_id, donation_id, scheduled_date, status                             | links matches to logistics                  |
| `notifications`   | id, user_id, type, channel, is_read                                           | user-scoped alerts                          |
| `audit_logs`      | id, user_id, action, entity_type, entity_id, timestamp                        | immutable action history                    |

---

## CHAPTER 6 — DATASET AND DATA PREPARATION

### Item Category Taxonomy

The platform recognizes 8 primary item categories, each mapped from YOLO class names:

**Table 6.1: Detectable Item Categories and YOLO Class Mapping**

| Category        | Example YOLO Classes                          | Description                               |
| --------------- | --------------------------------------------- | ----------------------------------------- |
| `clothing`    | shirt, jacket, coat, dress, pants, shoes, hat | Wearable garments and accessories         |
| `books`       | book, notebook, magazine                      | Printed educational and reading materials |
| `electronics` | laptop, phone, tablet, keyboard, tv, monitor  | Consumer electronic devices               |
| `furniture`   | chair, couch, table, bed, sofa                | Household furniture items                 |
| `food`        | bottle, bowl, cup, fork, knife, spoon         | Food items and kitchen utensils           |
| `toys`        | teddy bear, ball, toy                         | Children's play items                     |
| `medical`     | medical                                       | Medical supplies and equipment            |
| `other`       | Any unrecognized class                        | Fallback for unclassified items           |

### Item Detection Pipeline

When a donor initiates a scan:

1. The browser camera stream captures a JPEG/PNG frame.
2. The image is uploaded as a multipart file to the backend detection endpoint.
3. PIL decodes the image bytes to an RGB image.
4. YOLOv8 runs inference with `verbose=False`; detections below the confidence threshold (default: 0.40) are filtered out.
5. Detections are aggregated by class name. For each class, the system tracks: count, confidence sum (for average calculation), and the bounding box of the highest-confidence instance.
6. Aggregated results are sorted by average confidence descending and returned to the frontend.

*Figure 6.1: YOLOv8 item detection pipeline*

### Data Quality and Validation

**Table 6.2: Data Quality and Validation Checks**

| Check                  | Implementation                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- |
| File type validation   | FastAPI UploadFile MIME type check (JPEG/PNG only)                               |
| File size limit        | Configurable MAX_UPLOAD_SIZE_MB (default: 10 MB)                                 |
| Confidence threshold   | Detections below DETECTION_CONFIDENCE (default: 0.40) are silently discarded     |
| Quantity constraint    | DB CHECK (quantity > 0) on donation_items                                        |
| Score range constraint | DB CHECK (score >= 0.0 AND score <= 1.0) on matches                              |
| Confidence score range | DB CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0) on donation_items |
| Pydantic v2 validation | All API request/response DTOs validated with strict Pydantic models              |

---

## CHAPTER 7 — IMPLEMENTATION

### 7.1 Backend API (FastAPI)

The backend is structured as a modular FastAPI application with an application factory pattern in `main.py`. The `lifespan` context manager handles startup tasks: creating the media directory, loading the YOLO detector (with `MockDetector` fallback), and initializing the `EmbeddingService`.

```
backend/app/
├── ai/               # YOLOv8 detector, MockDetector, BaseDetector interface
├── api/v1/           # Route handlers (auth, donors, ngos, detection, matching,
│                     # pickups, admin, analytics, notifications)
├── core/             # Security (JWT), middleware, dependencies, exceptions
├── matching/         # BaseScorer, WeightedScorer, matching engine
├── models/           # SQLAlchemy ORM models
├── schemas/          # Pydantic v2 request/response DTOs
├── services/         # Business logic (donation, NGO, matching, embedding,
│                     # notification, analytics, auth, pickup)
├── utils/            # Shared utilities (matching algorithm, helpers)
├── config.py         # Pydantic Settings — environment configuration
├── database.py       # Async SQLAlchemy session factory
└── main.py           # FastAPI application factory and lifespan hooks
```

**Key API Endpoints:**

| Endpoint                           | Method | Role   | Description                        |
| ---------------------------------- | ------ | ------ | ---------------------------------- |
| `/api/v1/auth/register`          | POST   | Public | Register as donor, NGO, or admin   |
| `/api/v1/auth/login`             | POST   | Public | Obtain JWT access token            |
| `/api/v1/detection/scan`         | POST   | Donor  | Upload image; run YOLOv8 inference |
| `/api/v1/donations/`             | POST   | Donor  | Create donation from cart          |
| `/api/v1/donations/{id}/match`   | POST   | Donor  | Trigger matching engine            |
| `/api/v1/ngos/demands/`          | POST   | NGO    | Publish a demand request           |
| `/api/v1/matching/{id}/accept`   | POST   | NGO    | Accept a proposed match            |
| `/api/v1/pickups/`               | POST   | NGO    | Schedule a pickup                  |
| `/api/v1/admin/ngos/{id}/verify` | PATCH  | Admin  | Verify or reject an NGO            |
| `/api/v1/analytics/`             | GET    | Admin  | Platform-wide analytics            |
| `/health`                        | GET    | Public | Service health check               |

### 7.2 AI Detection Module (YOLOv8)

The `YOLODetector` class wraps the Ultralytics YOLO model. The core detection loop:

```python
results = self._model(image, verbose=False)
for result in results:
    for box in result.boxes:
        cls_id = int(box.cls[0])
        conf   = float(box.conf[0])
        name   = result.names.get(cls_id, f"object_{cls_id}")
        if conf >= settings.detection_confidence:
            # aggregate by class name ...
```

The `MockDetector` provides realistic synthetic detections for development and testing without requiring YOLO weights.

### 7.3 Weighted Matching Engine

The `WeightedScorer` implements the `BaseScorer` interface and computes a composite score:

```
Score = 0.25 x item_type
      + 0.20 x quantity
      + 0.15 x priority
      + 0.10 x distance
      + 0.15 x urgency
      + 0.15 x semantic
```

**Dimension Definitions:**

| Dimension | Logic                                                                                  |
| --------- | -------------------------------------------------------------------------------------- |
| item_type | 1.0 if any confirmed donation item matches demand's item_category, else 0.0            |
| quantity  | min(1.0, donated_qty / remaining_needed_qty)                                           |
| priority  | Base 0.6; +0.4 if donor city exactly matches NGO city                                  |
| distance  | 1.0 if donor city in NGO service_areas; 0.85 state match; 0.5 state-level; 0.1 default |
| urgency   | Critical=1.0, High=0.75, Medium=0.50, Low=0.25                                         |
| semantic  | Cosine similarity of all-MiniLM-L6-v2 embeddings of descriptions vs. demand text       |

*Figure 7.1: Weighted matching engine scoring flow*

### 7.4 Semantic Embedding Service

The `EmbeddingService` loads `sentence-transformers/all-MiniLM-L6-v2` once at startup and exposes a thread-safe, in-memory cached embedding operation:

```python
def cosine_similarity(self, left: str, right: str) -> float:
    left_vector  = self.embed(left)   # cached
    right_vector = self.embed(right)  # cached
    score = sum(a * b for a, b in zip(left_vector, right_vector))
    return max(0.0, min(1.0, float(score)))
```

Normalized embeddings reduce cosine similarity to a simple dot product. The cache key is the normalized, lowercased text string. If the model fails to load, the matching engine falls back to a rule-based keyword overlap scorer.

*Figure 7.2: Semantic embedding similarity computation*

### 7.5 Frontend (React 19 SPA)

The frontend is a TypeScript React application built with Vite, organized using Atomic Design principles:

```
frontend/src/
├── api/          # Axios API client + typed endpoint wrappers
├── components/   # Atoms, molecules, organisms, templates
├── hooks/        # Custom React hooks (useApiQuery, useDonations, useAuth)
├── pages/        # Route-level pages (Donor, NGO, Admin, Auth, Shared)
├── store/        # Global state management
├── types/        # TypeScript interfaces
├── utils/        # Utility functions (cn, formatters)
├── App.tsx       # Root component — React Router v7 config
└── main.tsx      # Entry point
```

Key design decisions:

- **React Hook Form + Zod**: Type-safe form validation with schema inference.
- **Axios interceptors**: JWT attachment and 401 refresh token handling.
- **Recharts**: Analytics dashboards and fulfillment trend charts.
- **Tailwind CSS v4 + Glassmorphism**: Consistent, premium design system.

### 7.6 Authentication and Security

- **Password hashing**: `bcrypt` (via `passlib`) with default work factor.
- **JWT**: HS256 signed tokens; 15 minutes access token TTL, 7 days refresh token TTL.
- **RBAC**: FastAPI dependencies check the user's `UserRole` enum value on every protected route. Cross-role access returns HTTP 403 Forbidden.
- **CORS**: Origin whitelist configured via `ALLOWED_ORIGINS` env variable.
- **Request logging middleware**: Every request is logged with method, path, client IP, status code, and response time.

---

## CHAPTER 8 — EVALUATION METRICS

**Table 8.1: Evaluation Metrics**

| Metric                | Formula                                   | What It Measures                                                       |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Detection Confidence  | Model confidence score (0.0 to 1.0)       | YOLOv8 certainty that a detected object belongs to the predicted class |
| Match Score           | Weighted composite (see Chapter 7.3)      | Overall relevance of a donor donation to an NGO demand                 |
| Item Type Score       | Binary: 1.0 or 0.0                        | Category alignment between donated items and NGO demand                |
| Quantity Coverage     | min(1.0, donated / needed)                | How well the donated quantity satisfies the NGO remaining need         |
| Semantic Similarity   | Cosine similarity of embeddings           | Contextual relevance of item descriptions to demand specifications     |
| Distance Score        | Rule-based geographic match (0.1 to 1.0)  | Logistical feasibility based on city/state/service_area alignment      |
| Fulfillment Rate      | completed_donations / total_accepted      | Platform-wide donation success rate                                    |
| Match Acceptance Rate | accepted_matches / total_proposed_matches | Proportion of AI-proposed matches accepted by NGOs                     |

Detection confidence threshold is set at 0.40 by default; matches below a composite score of 0.50 are not proposed.

---

## CHAPTER 9 — RESULTS AND DISCUSSION

### Detection Results

The YOLOv8 integration successfully identifies common household donation items in real browser camera captures. The category mapping covers 8 primary categories with 30+ YOLO class aliases. Items are aggregated per class, preventing duplicate entries for multiple instances of the same item type in one frame.

The `MockDetector` provides deterministic synthetic detections for development, returning realistic items (books, electronics, clothing) with confidence scores between 0.7 and 0.95 — enabling full platform testing without YOLO model weights.

### Matching Results

The `WeightedScorer` produces scores in the range [0.0, 1.0]:

- A perfect match (exact category, sufficient quantity, same city, critical urgency, high semantic similarity) scores approximately 0.92 to 1.00.
- A partial match (correct category, insufficient quantity, different state, medium urgency, moderate semantic similarity) scores approximately 0.45 to 0.65.
- A near-miss (wrong category) scores approximately 0.0 to 0.25 regardless of other dimensions, since item_type contributes 25%.

The semantic similarity component adds meaningful differentiation: a donor describing "grade 10 mathematics textbook" will score higher against an NGO demand for "educational textbooks for secondary students" than against "fiction novels for community library" even though both are in the `books` category.

### Donation Lifecycle

The platform successfully tracks the full status pipeline through 13 states:

`draft -> pending -> detected -> pending_match -> matched -> accepted -> packaging_notified -> acknowledged -> pickup_scheduled -> collected -> delivered -> completed`

Each transition is persisted in the database with timestamps and triggers the appropriate notification events.

### Dashboard Analytics

The Admin dashboard aggregates:

- Total users by role.
- Total NGOs by verification status.
- Total donations by status.
- Total matches by outcome.
- Platform fulfillment rate and pickup completion statistics.

*Figure 9.1: Donor dashboard screenshot*
*Figure 9.2: Camera-scan and item cart screenshot*
*Figure 9.3: NGO demand management and match feed screenshot*
*Figure 9.4: Admin dashboard screenshot*

---

## CHAPTER 10 — CONCLUSION AND FUTURE WORK

### Conclusion

This project demonstrates that AI can meaningfully improve the efficiency, transparency, and accessibility of physical donation management. By combining YOLOv8 object detection for frictionless item cataloging with a semantic-embedding-powered weighted matching engine, the platform removes two of the biggest barriers to effective donation routing: donor friction and match opacity.

The system is built on a production-grade technology stack (FastAPI, async PostgreSQL, React 19, Docker) with security, observability, and graceful AI fallbacks designed in from the start. The full donation lifecycle — from camera scan to delivery — is tracked, persisted, and visible to all stakeholders through role-appropriate dashboards.

**Table 10.1: Matching Score Component Weights**

| Dimension             | Weight | Rationale                                                          |
| --------------------- | ------ | ------------------------------------------------------------------ |
| Item Type Match       | 25%    | Category alignment is the most fundamental compatibility criterion |
| Quantity Coverage     | 20%    | Quantity determines practical impact of the donation               |
| Urgency Level         | 15%    | NGO urgency signals real-world criticality                         |
| Semantic Similarity   | 15%    | NLP captures contextual nuance beyond category labels              |
| Priority (Geographic) | 15%    | Local donations are easier to collect and deliver                  |
| Distance Score        | 10%    | Complements priority with service area mapping                     |

### Future Work

1. **Active Learning for YOLO Fine-tuning**: Collect donation images from the platform and use uncertainty sampling to select the most informative images for annotation, fine-tuning YOLOv8 on a domain-specific dataset.
2. **Multi-model Ensemble Detection**: Combine YOLOv8 with MobileNet or EfficientDet for higher accuracy on small or occluded donation items.
3. **Vector Database Integration**: Replace the in-memory embedding cache with a persistent vector database (Pinecone, pgvector, Weaviate) to support large-scale semantic search.
4. **Real-Time Notifications**: Extend the notification service with WebSocket push for live match alerts and pickup status updates.
5. **Donor Eco-Impact Analytics**: Calculate and display estimated CO2 reduction and landfill waste diverted per donation.
6. **Driver App**: A dedicated Flutter screen for logistics drivers to confirm pickups, upload photo proof of delivery, and update location.
7. **NGO Analytics Portal**: Trend charts for demand fulfillment history, average time-to-match, and category-level supply/demand gap analysis.
8. **Multi-language NLP**: Extend the embedding pipeline to support multilingual item descriptions using a multilingual sentence-transformer model.

---

## CHAPTER 11 — TESTING

### Functional Test Cases

**Table 11.1: Functional Test Cases**

| ID    | Test Case                                | Input                                                      | Expected Outcome                              | Test Type   |
| ----- | ---------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- | ----------- |
| TC-01 | User registration (donor)                | Valid email, password, role=donor                          | HTTP 201, user record created                 | Integration |
| TC-02 | Duplicate email registration             | Existing email                                             | HTTP 409 Conflict                             | Integration |
| TC-03 | Login with valid credentials             | email + password                                           | HTTP 200, JWT token returned                  | Integration |
| TC-04 | Login with wrong password                | email + wrong password                                     | HTTP 401 Unauthorized                         | Integration |
| TC-05 | Image detection (YOLO)                   | JPEG image of books                                        | HTTP 200, detections with category=books      | Integration |
| TC-06 | Image detection (MockDetector)           | Any image                                                  | HTTP 200, synthetic detections returned       | Unit        |
| TC-07 | Create donation                          | Authenticated donor, valid items                           | HTTP 201, donation status=pending             | Integration |
| TC-08 | Trigger matching                         | Donation ID, NGO demands in DB                             | HTTP 200, at least 1 match with score >= 0.50 | Integration |
| TC-09 | WeightedScorer — exact match            | Same category, sufficient qty, same city, critical urgency | Total score >= 0.80                           | Unit        |
| TC-10 | WeightedScorer — wrong category         | Different category                                         | Total score <= 0.25 (item_type=0)             | Unit        |
| TC-11 | NGO accepts match                        | Valid match ID, NGO token                                  | Match status=accepted, pickup schedulable     | Integration |
| TC-12 | Cross-role access (donor to admin route) | Donor JWT, admin endpoint                                  | HTTP 403 Forbidden                            | Security    |
| TC-13 | Admin NGO verification                   | NGO ID, admin JWT                                          | NGO status=verified                           | Integration |
| TC-14 | Health check endpoint                    | GET /health                                                | HTTP 200, status healthy                      | Smoke       |

### Risk Register

**Table 11.2: Risks and Mitigation Actions**

| Risk | Description                               | Mitigation                                                                             |
| ---- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| R-01 | YOLO model weights unavailable at startup | MockDetector fallback activated automatically; logged as WARNING                       |
| R-02 | Embedding model fails to load             | Rule-based keyword scorer used as fallback; no service disruption                      |
| R-03 | Database connection unavailable           | FastAPI startup logs error; health endpoint returns unhealthy status                   |
| R-04 | Donor uploads corrupted image             | PIL Image.open() exception caught; empty detection list returned                       |
| R-05 | JWT secret key not rotated                | Config validates that SECRET_KEY is not the default placeholder; logs SECURITY WARNING |
| R-06 | CORS misconfiguration in production       | Config warns if ALLOWED_ORIGINS contains wildcard in production mode                   |
| R-07 | Sensitive donor data exposed              | PII scoped to DonorProfile; API responses use DTOs that exclude raw DB fields          |
| R-08 | Match score gaming by NGO                 | Scores are computed server-side and never accepted from client input                   |

---

## APPENDIX A — ALGORITHM DETAILS

### Donation Matching Algorithm Flow

```
INPUT: donation_id, donor_city, donor_state
  1. Load all confirmed DonationItems for the donation.
  2. Query all eligible NGODemands:
       - NGO is verified
       - demand status is 'active'
       - quantity_fulfilled < quantity_needed
  3. For each NGODemand d:
       a. Build ScorerInput(donation_items, demand=d, ngo_profile, donor_city, donor_state)
       b. score_result = WeightedScorer.score(scorer_input)
       c. If score_result.total_score >= MATCH_SCORE_THRESHOLD (0.50):
            - Persist Match(donation_id, ngo_demand_id, ngo_id, score, status=proposed)
  4. Take top-N matches (default: 3) by score descending.
  5. Update donation status to 'matched'.
  6. Dispatch 'match_found' notifications to matched NGOs.
OUTPUT: List[Match] sorted by score descending
```

### Semantic Similarity Sub-Algorithm

```
INPUT: donor_item_descriptions (list of strings), demand_text (string)
  1. Concatenate donor descriptions: combined = " ".join(descriptions)
  2. Normalize both texts: lower-case, collapse whitespace
  3. Check embedding cache for both normalized strings
  4. If not cached: encode with SentenceTransformer(all-MiniLM-L6-v2)
        - normalize_embeddings=True
        - Returns 384-dimensional unit vector
  5. cosine_similarity = dot_product(left_vector, right_vector)
        - For normalized vectors this equals the cosine of the angle
  6. Clamp to [0.0, 1.0] and return
OUTPUT: float in [0.0, 1.0]
```

---

## APPENDIX B — TEST CASES AND ACCEPTANCE CHECKLIST

### Functional Test Acceptance Checklist

- [ ] All 14 functional test cases (TC-01 through TC-14) pass.
- [ ] YOLO detector endpoint returns HTTP 200 with at least one detection for a test image.
- [ ] MockDetector returns valid DetectionResult objects with correct ItemCategory enum values.
- [ ] WeightedScorer unit tests confirm score = 0.0 when item_type score = 0.0 (wrong category).
- [ ] JWT token rejection (expired or tampered) returns HTTP 401.
- [ ] Cross-role access returns HTTP 403.
- [ ] Donation status transitions follow the defined pipeline (no skipped states).
- [ ] Health check endpoint returns success=true when DB connection is healthy.

### Model and Matching Acceptance Checklist

- [ ] Confidence threshold (0.40) correctly filters low-confidence detections.
- [ ] WeightedScorer weights sum to exactly 1.0.
- [ ] Matches with total_score < 0.50 are not persisted.
- [ ] No more than MATCH_TOP_N (default: 3) matches are proposed per donation.
- [ ] Semantic similarity uses normalized embeddings (dot product = cosine similarity).
- [ ] Embedding cache is thread-safe (RLock used for cache writes).

---

## APPENDIX C — ENVIRONMENT CONFIGURATION REFERENCE

| Variable                        | Description                                | Default / Example                                 |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| `APP_NAME`                    | Application display name                   | Donation Management System                        |
| `ENVIRONMENT`                 | Deployment environment                     | production                                        |
| `DEBUG`                       | Enable Swagger UI and debug logs           | false                                             |
| `DATABASE_URL`                | PostgreSQL async connection string         | postgresql://user:pass@localhost:5432/donation_db |
| `SECRET_KEY`                  | JWT signing key (min 32 chars)             | 64+ random characters                             |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token TTL                       | 15                                                |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | JWT refresh token TTL                      | 7                                                 |
| `ALLOWED_ORIGINS`             | Comma-separated CORS allowed origins       | http://localhost:5173,http://localhost:3000       |
| `USE_MOCK_DETECTOR`           | Use MockDetector instead of YOLO           | false                                             |
| `DETECTION_CONFIDENCE`        | Minimum YOLO confidence threshold          | 0.40                                              |
| `YOLO_MODEL_PATH`             | Path to YOLO .pt weights file              | ./models/yolov8l.pt                               |
| `MATCH_SCORE_THRESHOLD`       | Minimum composite score to propose a match | 0.50                                              |
| `MATCH_TOP_N`                 | Maximum matches proposed per donation      | 3                                                 |
| `MATCH_EXPIRY_HOURS`          | Hours before a proposed match expires      | 48                                                |
| `MEDIA_PATH`                  | Directory for uploaded scan images         | ./media                                           |
| `MAX_UPLOAD_SIZE_MB`          | Maximum allowed upload file size           | 10                                                |
| `VITE_API_BASE_URL`           | Frontend API base URL                      | http://localhost:8000/api/v1                      |

---

## APPENDIX D — GLOSSARY

| Term                | Definition                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Active Learning     | A machine learning technique where the model queries a human for labels on the most uncertain data points, improving training efficiency. |
| Bounding Box        | A rectangle (x1, y1, x2, y2) returned by YOLOv8 that localizes a detected object within the image.                                        |
| Cosine Similarity   | A measure of the angle between two vectors; equals 1.0 for identical vectors and 0.0 for orthogonal (completely dissimilar) vectors.      |
| Demand              | An NGO structured request for a specific item category, quantity, and urgency level, published through the platform.                      |
| Embedding           | A dense, high-dimensional numerical vector representation of text produced by a transformer model. Used to measure semantic similarity.   |
| FastAPI             | A modern, high-performance Python web framework for building asynchronous REST APIs with automatic OpenAPI documentation.                 |
| ItemCategory        | A platform enum defining 8 item types: clothing, books, electronics, furniture, food, toys, medical, other.                               |
| JWT                 | JSON Web Token; a compact, signed credential used for stateless authentication.                                                           |
| MockDetector        | A development substitute for YOLOv8 that returns deterministic synthetic item detections without loading model weights.                   |
| NGO                 | Non-Governmental Organization; a non-profit entity serving communities in need.                                                           |
| RBAC                | Role-Based Access Control; a security model where access permissions are defined by the user assigned role (Donor, NGO, Admin).           |
| Semantic Similarity | A measure of how similar the meaning of two text passages is, regardless of exact word overlap. Computed via embedding cosine similarity. |
| SentenceTransformer | A Python library and model family that produces fixed-size sentence embeddings optimized for semantic similarity tasks.                   |
| WeightedScorer      | The platform matching engine implementation that combines 6 scored dimensions with configurable weights into a composite match score.     |
| YOLOv8              | You Only Look Once version 8; a state-of-the-art, single-shot object detection neural network by Ultralytics.                             |

---

## REFERENCES

1. Redmon, J., Divvala, S., Girshick, R., and Farhadi, A. (2016). You Only Look Once: Unified, Real-Time Object Detection. *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*.
2. Jocher, G. et al. Ultralytics YOLOv8 — Official Documentation and Model Resources. Available at: https://docs.ultralytics.com/. Version used: 8.3.168.
3. Reimers, N., and Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. *Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing (EMNLP)*.
4. Devlin, J., Chang, M.-W., Lee, K., and Toutanova, K. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. *Proceedings of NAACL-HLT 2019*.
5. Hugging Face. sentence-transformers/all-MiniLM-L6-v2 Model Card. Available at: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2.
6. FastAPI — Official Python API Documentation. Available at: https://fastapi.tiangolo.com/. Version used: 0.111.0.
7. SQLAlchemy 2.0 Async ORM Documentation. Available at: https://docs.sqlalchemy.org/en/20/orm/. Version used: 2.0.30.
8. Pydantic v2 Documentation. Available at: https://docs.pydantic.dev/latest/. Version used: 2.7.1.
9. React Documentation — React 19. Available at: https://react.dev/. Version used: 19.2.7.
10. Tailwind CSS v4 Documentation. Available at: https://tailwindcss.com/docs. Version used: 4.3.2.
11. Project source code and internal documentation: AI_donation_infy/ — including README.md, docs/architecture-backend.md, docs/architecture-frontend.md, docs/architecture-mobile.md. Developed as part of the Infosys Springboard Internship (2026).
