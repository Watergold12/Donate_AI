# 🌟 AI-Based Donation Management System for Intelligent Resource Matching & Distribution

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2.7-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF?style=for-the-badge)](https://docs.ultralytics.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Sentence--Transformers-EE4C2C?style=for-the-badge&logo=pytorch)](https://sbert.net/)
[![License](https://img.shields.io/badge/License-VAA--CCL--1.0-8A2BE2?style=for-the-badge)](LICENSE)

An end-to-end, AI-powered donation management platform that bridges the gap between donors and Non-Governmental Organizations (NGOs). By leveraging computer vision for automated item cataloging and natural language processing (NLP) vector search for intelligent resource matching, the platform ensures rapid, accurate, and transparent distribution of physical donations.

---

## 📋 Table of Contents

- [Features Implemented](#-features-implemented)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Platform Architecture Docs](#-platform-architecture-docs)
- [Project Directory Structure](#-project-directory-structure)
- [Self-Hosting & Local Setup Guide](#-self-hosting--local-setup-guide)
  - [Prerequisites](#prerequisites)
  - [1. Database Configuration](#1-database-configuration)
  - [2. Backend Service Setup](#2-backend-service-setup)
  - [3. Frontend Service Setup](#3-frontend-service-setup)
  - [4. Docker Containerized Hosting](#4-docker-containerized-hosting)
- [Environment Variables Reference](#-environment-variables-reference)
- [Running Automated Tests](#-running-automated-tests)
- [License & Acknowledgments](#-license--acknowledgments)

---

## ✨ Features Implemented

### 📸 1. Camera-Based Item Detection & Auto-Cataloging (Computer Vision)
- **Real-Time Browser Camera Stream**: Uses the HTML5 MediaDevices API to capture live item images directly in the browser.
- **YOLOv8 Object Detection**: Integrated `ultralytics` YOLO object detection pipeline to recognize everyday donation items (books, clothing, electronics, sports equipment, appliances, etc.).
- **Automatic Multi-Item Extraction**: Extracts item categories, confidence scores, bounding boxes, and quantity estimates from single or multi-object scans.
- **Robust Detector Fallback**: Built-in `MockDetector` fallback that guarantees uninterrupted donor onboarding if YOLO model weights fail to load or are disabled.
- **Interactive Item Cart**: Donors can inspect detected items, locked category labels, edit quantities, add descriptive notes for context (e.g., *"grade 10 math textbook"*), and remove unwanted items prior to donation creation.

### 🧠 2. Intelligent Resource Matching Engine (Vector Search & NLP)
- **Multi-Attribute Weighted Scoring**: Matching engine evaluates category alignment, quantity compatibility, geographic distance, urgency weight, and semantic similarity.
- **Semantic Embedding Vector Search**: Powered by `sentence-transformers/all-MiniLM-L6-v2` (Hugging Face) to compare donor item descriptions with NGO demand specifications.
- **Rule-Based Fallback Matcher**: Graceful fallback matching logic when embedding models are offline or under heavy load.
- **Match Transparency & Explainability**: Surfaces granular score breakdowns (category match %, urgency weight, location distance fit, semantic similarity %) in API responses and frontend cards.

### 🏛️ 3. NGO Registry & Demand Management Portal
- **NGO Registration & Profile Management**: Complete onboarding flow for NGOs with mission details, license IDs, address information, and point of contact.
- **Verification Workflow**: Multi-tier status verification system (`Pending`, `Verified`, `Rejected`) managed via administrator review filters.
- **Demand Registry**: NGOs can publish detailed demand requests with priority tiers (`Low`, `Medium`, `High`, `Critical`), required quantities, item categories, and delivery deadlines.

### 🚚 4. Donation Workflow & Pickup Logistics
- **End-to-End Submission Pipeline**: Multi-step flow connecting item scanning $\rightarrow$ cart review $\rightarrow$ AI matching $\rightarrow$ scheduling.
- **Scheduled Pickup Logistics**: Pickup slot management, donor address selection, special instructions, and driver dispatch notes.
- **Status Lifecycle Tracking**: Real-time status pipeline (`Scheduled`, `In Transit`, `Picked Up`, `Delivered`, `Cancelled`).
- **Donor Packaging Guidance**: Packaging instructions and preparation checklists generated prior to driver pickup.

### 📊 5. Role-Based Portals & Analytics Dashboards
- **Donor Dashboard**: Camera scanner link, active pickups tracker, donation history, and eco-impact metrics (estimated CO₂ reduction, landfill waste diverted).
- **NGO Dashboard**: Demand creation modal, real-time AI match recommendations feed, donation acceptance flow, and fulfillment statistics.
- **Admin Dashboard**: System-wide activity monitor, user management, NGO verification review center, and platform performance metrics.

### 🔐 6. Authentication, RBAC & Security
- **Role-Based Access Control (RBAC)**: Secure access routes for `Donor`, `NGO`, and `Admin` users.
- **JWT Authentication**: Password hashing with `bcrypt`, access tokens, and refresh token rotation.
- **API Security**: Standardized API response format (`{ "success": bool, "data": ..., "message": ... }`), CORS origin filtering, and request logging middleware.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript (built with Vite) |
| **Styling & UI** | Tailwind CSS v4, Lucide Icons, Glassmorphism UI |
| **Charts & Data Visualization** | Recharts |
| **Routing & Forms** | React Router v7, React Hook Form, Zod validation |
| **Backend Framework** | Python 3.11 + FastAPI |
| **Database & ORM** | PostgreSQL 14+, SQLAlchemy 2.0 (Async), Alembic migrations |
| **AI / Object Detection** | Ultralytics YOLOv8 |
| **AI / Semantic Embeddings** | Sentence-Transformers (`all-MiniLM-L6-v2`), PyTorch |
| **Authentication** | OAuth2 with Password Hashing (bcrypt) + JWT |
| **Containerization** | Docker, Multi-Stage Builds |

---

## 🏗️ System Architecture

```
                                  +-----------------------+
                                  |   React 19 Frontend   |
                                  |   (Vite + Tailwind)   |
                                  +-----------+-----------+
                                              |
                                              | REST API (JSON)
                                              v
                                  +-----------------------+
                                  |    FastAPI Backend    |
                                  +-----+-----------+-----+
                                        |           |
             +--------------------------+           +--------------------------+
             |                                                                 |
             v                                                                 v
+--------------------------+                                       +--------------------------+
|  AI Inference Engine     |                                       | PostgreSQL Database      |
|  - YOLOv8 (Vision)       |                                       | - Donors & NGOs          |
|  - MiniLM (Vector Embeds)|                                       | - Demands & Donations    |
+--------------------------+                                       | - Matches & Pickups      |
                                                                   +--------------------------+
```

---

## 📚 Platform Architecture Docs

For a deep dive into the specific technologies, libraries, and core workflows of each stack layer, please refer to our detailed architectural documents:

- **[Backend Architecture](docs/architecture-backend.md)**: Details the FastAPI, SQLAlchemy, and AI model integration.
- **[Frontend Architecture](docs/architecture-frontend.md)**: Details the React 19 web SPA, Tailwind styling, and React Hook Form validation.
- **[Mobile App Architecture](docs/architecture-mobile.md)**: Details the cross-platform Flutter application, camera hardware integration, and routing.

---

## 📁 Project Directory Structure

```
AI_donation_infy/
├── backend/                        # FastAPI Backend Application
│   ├── alembic/                    # Database migration scripts & history
│   ├── app/
│   │   ├── ai/                     # YOLOv8 detector, MockDetector, & BaseDetector interface
│   │   ├── api/v1/                 # API Endpoints (auth, donors, ngos, detection, matching, pickups, admin)
│   │   ├── core/                   # Security, JWT, middleware, dependencies, custom exceptions
│   │   ├── matching/               # Weighted matching engine, scorer & vector similarity logic
│   │   ├── models/                 # SQLAlchemy ORM Database models & Enum types
│   │   ├── schemas/                # Pydantic v2 validation schemas (request/response DTOs)
│   │   ├── services/               # Business logic: donation, NGO, matching, embedding, notification, analytics
│   │   ├── utils/                  # Shared utility helpers
│   │   ├── config.py               # Pydantic Settings — all env config in one place
│   │   ├── database.py             # Async SQLAlchemy session factory
│   │   └── main.py                 # FastAPI application factory & lifespan hooks
│   ├── media/                      # Uploaded scan images served as static assets
│   ├── models/                     # YOLO weight files (.pt)
│   ├── tests/                      # Pytest test suite (auth, donations, NGOs, matching, pickups, AI)
│   ├── Dockerfile                  # Multi-stage production Docker image
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment template
├── frontend/                       # React 19 + TypeScript Web Frontend (Vite)
│   ├── src/
│   │   ├── api/                    # Axios API client + typed endpoint wrappers
│   │   ├── components/             # Atomic Design components (atoms, molecules, organisms, templates)
│   │   ├── hooks/                  # Custom React hooks (useApiQuery, useDonations, useAuth, etc.)
│   │   ├── pages/                  # Route-level pages (Donor, NGO, Admin, Auth, Shared)
│   │   ├── store/                  # Global state management
│   │   ├── types/                  # TypeScript interfaces & type definitions
│   │   ├── utils/                  # Shared utility functions (cn, formatters, etc.)
│   │   ├── App.tsx                 # Root component — React Router config & global providers
│   │   └── main.tsx                # Application entry point
│   ├── package.json                # Frontend Node.js dependencies & npm scripts
│   ├── vite.config.ts              # Vite bundler & dev-proxy configuration
│   └── .env.example                # Frontend environment template
├── mobile_frontend/                # Flutter Cross-Platform Mobile App (Android & iOS)
│   ├── lib/
│   │   ├── app/                    # Root app config & ThemeData
│   │   ├── core/                   # ApiClient, ApiConfig, shared theme
│   │   ├── features/               # Feature modules: auth, donor, ngo, home, dashboard
│   │   └── main.dart               # Application entry point
│   ├── android/                    # Android platform build files
│   ├── ios/                        # iOS platform build files
│   └── pubspec.yaml                # Flutter dependencies & asset declarations
└── README.md                       # Main Project Documentation
```

---

## 🌐 Self-Hosting & Local Setup Guide

Follow these steps to host and run the application locally or on a private server.

### Prerequisites

Ensure you have the following installed on your host system:
- **Python**: Version 3.11 or higher
- **Node.js**: Version 18.x or 20.x+ (with npm 9+)
- **PostgreSQL**: Version 14 or higher running locally or accessible via network
- **Git**: For cloning the repository

---

### 1. Database Configuration

Create a dedicated PostgreSQL database and user:

```bash
# Connect to PostgreSQL prompt
psql -U postgres

# Create database and user (replace 'your_secure_password' with a strong password)
CREATE DATABASE donation_db;
CREATE USER donation_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE donation_db TO donation_user;
\q
```

---

### 2. Backend Service Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python Virtual Environment**:
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. **Install Python Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and secret key:
   ```ini
   APP_NAME="Donation Management System"
   ENVIRONMENT=production
   DEBUG=false

   # Database Connection String
   DATABASE_URL=postgresql://donation_user:your_secure_password@localhost:5432/donation_db

   # JWT Security Key (Generate with: python -c "import secrets; print(secrets.token_urlsafe(64))")
   SECRET_KEY=replace_with_a_long_random_secret_key_at_least_64_characters_long
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

   # AI Model Settings
   USE_MOCK_DETECTOR=true   # Set to false to use YOLO weights
   DETECTION_CONFIDENCE=0.40
   MODEL_PATH=./models/best.pt
   ```

5. **Run Database Migrations**:
   Apply Alembic schema migrations to initialize database tables:
   ```bash
   alembic upgrade head
   ```

6. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - API Server running at: `http://localhost:8000`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - Health Check Endpoint: `http://localhost:8000/health`

---

### 3. Frontend Service Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` points to the running backend API:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   - Access the Web Application in your browser at: `http://localhost:5173`

5. **(Optional) Build for Production**:
   To generate optimized static assets for deployment via Nginx / Apache:
   ```bash
   npm run build
   ```
   The production-ready output will be located in `frontend/dist/`.

---

### 4. Docker Containerized Hosting

You can containerize the backend using the included production `Dockerfile`.

1. **Build the Backend Docker Image**:
   ```bash
   cd backend
   docker build -t donation-backend:latest .
   ```

2. **Run the Container linked to PostgreSQL**:
   ```bash
   docker run -d \
     --name donation-backend-container \
     -p 8000:8000 \
     -e DATABASE_URL="postgresql://donation_user:your_secure_password@host.docker.internal:5432/donation_db" \
     -e SECRET_KEY="replace_with_a_long_random_secret_key_at_least_64_characters_long" \
     -e USE_MOCK_DETECTOR="true" \
     donation-backend:latest
   ```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `APP_NAME` | Name of the application | `"Donation Management System"` |
| `ENVIRONMENT` | Environment mode (`development` / `production`) | `production` |
| `DEBUG` | Enable debug logs & Swagger UI | `false` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/donation_db` |
| `SECRET_KEY` | Secret key for signing JWT tokens | 64+ random characters |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration time for JWT access tokens | `30` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:5173,http://localhost:3000` |
| `USE_MOCK_DETECTOR` | Set `false` for active YOLO model inference | `true` |
| `DETECTION_CONFIDENCE` | Minimum confidence score threshold for YOLO | `0.40` |
| `MODEL_PATH` | Path to trained YOLO model weights file | `./models/best.pt` |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

---

## 🧪 Running Automated Tests

### Backend Tests (Pytest)

Navigate to the `backend/` directory and execute:

```bash
# Run all tests
pytest

# Run tests with detailed output and log output
pytest -v -s

# Run specific test suites
pytest tests/test_yolo_workflow.py
pytest tests/test_semantic_matching.py
```

### Frontend Validation

Navigate to the `frontend/` directory and execute:

```bash
# Check TypeScript types and build validity
npm run build

# Run ESLint validation
npm run lint
```

---

## 📄 License & Acknowledgments

This project is licensed under the **Vishal AA Community & Commercial License Version 1.0 (VAA-CCL-1.0)** - see the [LICENSE](LICENSE) file for terms and conditions.

All third-party component copyright attributions and open-source notices are detailed in the [NOTICE](NOTICE) file.

Developed as part of the **Springboard Internship (2026)** program.

- **FastAPI** for high-performance Python asynchronous APIs.
- **Ultralytics YOLOv8** for state-of-the-art computer vision object detection.
- **Sentence-Transformers** for open-source vector embeddings and semantic search.
- **React & Tailwind CSS** for responsive design.
