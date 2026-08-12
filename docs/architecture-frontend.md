# Frontend Web Architecture

The AI Donation Platform web frontend is a responsive, desktop-optimized Single Page Application (SPA) built with React 19 and TypeScript. It provides rich role-based dashboards for Donors, NGOs, and Administrators, and communicates exclusively with the FastAPI backend over REST.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Key Libraries & Responsibilities](#key-libraries--responsibilities)
- [Component Architecture](#component-architecture)
- [Routing & Role Guards](#routing--role-guards)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Custom Hooks](#custom-hooks)
- [Core Workflows](#core-workflows)
- [Developer Notes & Gotchas](#developer-notes--gotchas)

---

## Directory Structure

```text
frontend/
├── src/
│   ├── api/                      # Axios API client instances & endpoint wrappers
│   │   ├── client.ts             # Axios base instance with JWT interceptors & error handling
│   │   ├── index.ts              # Re-exports all API modules
│   │   ├── auth.ts               # Auth endpoints (login, register, refresh)
│   │   ├── donations.ts          # Donation CRUD & lifecycle
│   │   ├── donors.ts             # Donor profile management
│   │   ├── detection.ts          # Image upload & AI detection
│   │   ├── ngos.ts               # NGO profile & demand management
│   │   ├── matching.ts           # Match retrieval & acceptance
│   │   ├── pickups.ts            # Pickup scheduling
│   │   ├── notifications.ts      # Notification feed
│   │   ├── analytics.ts          # Dashboard metrics
│   │   └── admin.ts              # Admin verification & user management
│   ├── components/               # Reusable UI components (Atomic Design)
│   │   ├── atoms/                # Smallest primitives: Button, Badge, Spinner, Input
│   │   ├── molecules/            # Composed components: Cards, Form fields, Modals
│   │   ├── organisms/            # Complex sections: Nav, Sidebar, Detection Cart
│   │   └── templates/            # Full-page layout wrappers
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Auth state access from store
│   │   ├── useApiQuery.ts        # Generic GET data fetching hook
│   │   ├── useApiMutation.ts     # Generic POST/PUT/DELETE mutation hook
│   │   ├── useDonations.ts       # Donation-specific fetching & mutations
│   │   ├── useAnalytics.ts       # Dashboard analytics data hook
│   │   ├── useNotifications.ts   # Notification feed hook
│   │   └── index.ts              # Re-exports all hooks
│   ├── pages/                    # Route-level page components
│   │   ├── auth/                 # Login & Registration pages
│   │   ├── donor/                # Donor dashboard, camera scanner, history
│   │   ├── ngo/                  # NGO dashboard, demand portal, match feed
│   │   ├── admin/                # Admin verification, user management
│   │   └── shared/               # Landing page, 404, error boundaries
│   ├── store/                    # Global state management
│   ├── types/                    # TypeScript interfaces & type definitions
│   ├── utils/                    # Shared utility functions
│   ├── index.css                 # Global styles, Tailwind directives, CSS variables
│   ├── App.tsx                   # Root component: React Router config & global providers
│   └── main.tsx                  # Application entry point (ReactDOM.createRoot)
├── package.json                  # Node.js dependencies & npm scripts
├── vite.config.ts                # Vite bundler & dev-proxy configuration
└── .env.example                  # Frontend environment variable template
```

---

## Key Libraries & Responsibilities

### UI Framework & Build Tooling

| Library | Version | Purpose |
|---|---|---|
| **React** | 19 | Core UI library; component tree and reactive rendering |
| **TypeScript** | 5.0+ | Strict static typing across all components, hooks, and API types |
| **Vite** | — | Lightning-fast dev server with HMR; optimized production builds |

> **Why Vite?** Near-instant dev server startup and Hot Module Replacement (HMR) dramatically improves the development feedback loop compared to older webpack-based setups.

### Routing

| Library | Purpose |
|---|---|
| **React Router DOM v7** | Client-side routing; nested routes; role-based redirect guards |

All routes are defined in `App.tsx`. Protected routes check the authenticated user's role before rendering — unauthenticated users are redirected to `/login`.

### Styling & Design System

| Library | Purpose |
|---|---|
| **TailwindCSS v4** | Utility-first CSS framework; entire design language |
| **clsx** | Conditional class name composition |
| **tailwind-merge** | Safely overrides conflicting Tailwind classes in dynamic components |
| **Lucide React** | Consistent, clean SVG icon set used throughout the UI |

> **Pattern:** Most components use a `cn()` helper (wrapping `clsx` + `tailwind-merge`) for conditionally applying and merging Tailwind classes without conflicts. Look for `src/utils/cn.ts` or similar.

### Forms & Validation

| Library | Purpose |
|---|---|
| **React Hook Form** | Performant form state management — no unnecessary re-renders |
| **Zod** | Schema-based validation; defines the exact shape of valid form data |
| **@hookform/resolvers** | Bridges Zod schemas into React Hook Form via `zodResolver()` |

> **Pattern:** Define a Zod schema first, pass it to `useForm({ resolver: zodResolver(schema) })`. The form cannot be submitted unless data exactly matches the schema — which mirrors the backend Pydantic validation.

### Networking

| Library | Purpose |
|---|---|
| **Axios** | Promise-based HTTP client used in `src/api/` |

`api/client.ts` sets up a configured Axios instance with:
- Base URL from `VITE_API_BASE_URL` env variable
- JWT `Authorization: Bearer <token>` header injection on every request
- Global 401 interceptor to trigger token refresh or redirect to login

### Data Visualization

| Library | Purpose |
|---|---|
| **Recharts** | Composable React charting library for donation impact analytics |

Used in the Donor and NGO dashboards to display line graphs, bar charts, and area charts showing donation trends, match rates, and eco-impact metrics over time.

---

## Component Architecture

Components follow an **Atomic Design** hierarchy:

```
atoms/          → Smallest, stateless primitives (Button, Badge, Spinner, Input, Avatar)
    │
molecules/      → Composed from atoms; handle a single concern (DonationCard, DemandForm, MatchScoreCard)
    │
organisms/      → Complex, stateful sections (NavigationBar, DetectionCart, NotificationPanel)
    │
templates/      → Full-page layout wrappers (DashboardLayout, AuthLayout)
    │
pages/          → Route-level components; compose organisms + templates; own data fetching via hooks
```

This hierarchy keeps components focused, reusable, and easy to test in isolation. When building a new feature, start at the `atoms` level and work upward.

---

## Routing & Role Guards

Routes are configured in `App.tsx`. The application has three protected role zones:

| Zone | Path Prefix | Accessible By |
|---|---|---|
| Donor Dashboard | `/donor/*` | Users with `role = donor` |
| NGO Portal | `/ngo/*` | Users with `role = ngo` (verified NGOs) |
| Admin Panel | `/admin/*` | Users with `role = admin` |
| Public | `/`, `/login`, `/register` | Everyone |

Role guards redirect unauthorized users to their correct dashboard or back to `/login` if unauthenticated.

---

## State Management

The `src/store/` directory contains global application state. The auth store persists the logged-in user's profile and JWT access token. Role-specific data (donations, demands, notifications) is fetched on demand using the custom hooks layer rather than stored globally, keeping the store minimal.

---

## API Layer

`src/api/` acts as the complete contract between the frontend and the FastAPI backend. Each file corresponds to a backend router:

| File | Backend Router | Exports |
|---|---|---|
| `client.ts` | — | Axios instance with JWT interceptors |
| `auth.ts` | `/auth` | `login()`, `register()`, `refreshToken()`, `logout()` |
| `donations.ts` | `/donations` | `getDonations()`, `createDonation()`, `updateDonationStatus()` |
| `detection.ts` | `/detection` | `analyzeImage(formData)` |
| `ngos.ts` | `/ngos` | `getNGOProfile()`, `createDemand()`, `getDemands()` |
| `matching.ts` | `/matching` | `getMatches()`, `acceptMatch()`, `rejectMatch()` |
| `pickups.ts` | `/pickups` | `schedulePickup()`, `getPickups()`, `updatePickupStatus()` |
| `notifications.ts` | `/notifications` | `getNotifications()`, `markAsRead()` |
| `analytics.ts` | `/analytics` | `getDashboardMetrics()`, `getImpactData()` |
| `admin.ts` | `/admin` | `getPendingNGOs()`, `verifyNGO()`, `getAuditLogs()` |

> **Never call `axios` directly in a component.** Always go through the functions exported from `src/api/`. This keeps the API contract in one place and makes mocking for tests straightforward.

---

## Custom Hooks

`src/hooks/` provides reusable data-fetching and mutation hooks that wrap the API layer:

| Hook | Purpose |
|---|---|
| `useAuth` | Reads current user profile and auth status from the store |
| `useApiQuery` | Generic hook for GET requests: handles loading, error, and data states |
| `useApiMutation` | Generic hook for POST/PUT/DELETE: handles pending, success, and error states |
| `useDonations` | Fetches the current donor's donation list and exposes mutation helpers |
| `useAnalytics` | Fetches dashboard analytics data for charts |
| `useNotifications` | Fetches the notification feed and provides mark-as-read |

> **Pattern:** Page components should use these hooks for data fetching — not call API functions directly. This keeps components declarative and keeps side-effect logic in one place.

---

## Core Workflows

### 1. Authentication Flow

```
User submits login form (React Hook Form + Zod validation)
    → api/auth.ts login()
    → FastAPI returns { access_token, refresh_token, user }
    → Store saves access_token and user profile
    → React Router redirects user to role-specific dashboard
    → Axios interceptor attaches Bearer token to all subsequent requests
    → On 401 response: auto-refresh token via api/auth.ts refreshToken()
    → On refresh failure: logout and redirect to /login
```

### 2. Camera Detection & Donation Cart

```
Donor opens camera scanner page
    → MediaDevices API captures image from browser camera
    → Image submitted as multipart/form-data to detection API
    → api/detection.ts analyzeImage() → returns detected items list
    → Frontend renders editable Detection Cart (organism component)
    → Donor can: edit quantities, add descriptions, remove items
    → Donor confirms → api/donations.ts createDonation()
    → Donation created, matching runs on backend
    → Donor redirected to match results view
```

### 3. Dashboard Data Loading

```
Dashboard page mounts
    → useDonations() / useAnalytics() hooks run
    → useApiQuery() fires GET request with current JWT
    → Loading state shown while awaiting response
    → Data mapped to TypeScript types (src/types/)
    → Recharts components receive typed data arrays
    → Charts rendered with donation impact metrics
```

---

## Developer Notes & Gotchas

**Keep API calls in `src/api/` only.**
Components and hooks should never import `axios` directly. All HTTP calls go through the typed functions in `src/api/`. This pattern makes the API boundary clear and easy to mock in tests.

**TypeScript types are the source of truth.**
API response shapes are defined in `src/types/`. If the backend schema changes, update the TypeScript type first, then fix anything that breaks. Do not use `any`.

**Environment variable prefix.**
Vite only exposes env variables prefixed with `VITE_` to the browser bundle. Backend-only secrets must never be placed in `frontend/.env`.

**Zod schema ↔ Pydantic schema parity.**
Zod schemas on the frontend should mirror the Pydantic schemas on the backend. When you add a field to a backend schema, add it to the corresponding Zod schema and TypeScript type on the frontend.

**Production build check.**
Before pushing, always validate:
```bash
npm run build   # TypeScript compile + Vite bundle (catches type errors)
npm run lint    # ESLint validation
```

**Vite proxy.**
`vite.config.ts` likely includes a dev proxy that forwards `/api/*` requests to `http://localhost:8000`. This avoids CORS issues during local development. Check `vite.config.ts` if API calls are failing in dev but not production.
