# Mobile App Architecture

The AI Donation Platform mobile app is a cross-platform (Android & iOS) client built with the Flutter SDK and Dart. It provides an optimized, native-feeling experience for Donors on the go and NGOs managing demands from their phones. The app communicates with the same FastAPI backend used by the web frontend.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Key Libraries & Responsibilities](#key-libraries--responsibilities)
- [Feature Modules](#feature-modules)
- [Core Infrastructure](#core-infrastructure)
- [Routing & Navigation](#routing--navigation)
- [Camera & Hardware Integration](#camera--hardware-integration)
- [API Communication](#api-communication)
- [Core Workflows](#core-workflows)
- [Local Development Setup](#local-development-setup)
- [Developer Notes & Gotchas](#developer-notes--gotchas)

---

## Directory Structure

```text
mobile_frontend/
├── lib/
│   ├── app/                          # Root app configuration & theming
│   ├── core/                         # Shared infrastructure
│   │   ├── config/                   # ApiConfig — base URL, environment detection
│   │   ├── network/                  # ApiClient — HTTP wrapper with JWT & error handling
│   │   └── theme/                    # App-wide colors, typography, ThemeData
│   ├── features/                     # Feature-based folder structure (one folder per domain)
│   │   ├── auth/                     # Login, registration screens & logic
│   │   ├── home/                     # Landing/welcome screens
│   │   ├── donor/                    # Donor dashboard, camera flow, donation history
│   │   ├── ngo/                      # NGO dashboard, demands, verification status
│   │   └── dashboard/                # Shared dashboard tab scaffold
│   └── main.dart                     # Application entry point (runApp)
├── android/                          # Android platform-specific build files
├── ios/                              # iOS platform-specific build files
└── pubspec.yaml                      # Flutter dependencies & asset declarations
```

---

## Key Libraries & Responsibilities

### Framework

| Library | Purpose |
|---|---|
| **Flutter SDK** | Google's UI toolkit for building natively compiled apps from a single Dart codebase |
| **Dart** | The strongly-typed language powering all Flutter code |

> **Why Flutter?** A single Dart codebase compiles to native Android and iOS binaries, sharing 100% of the business logic and UI code while still achieving native-level performance and feel.

### Networking & API

| Library | Purpose |
|---|---|
| **http** | Core async HTTP library for all backend communication |
| **ApiClient** (`core/network/api_client.dart`) | Custom wrapper around `http`: handles JWT Bearer token attachment, global error parsing, request timeouts, and `ApiEnvelope` response extraction |

The `ApiClient` is the **only** place HTTP calls are made. All feature code calls methods on `ApiClient`, never `http` directly.

### Hardware & Device APIs

| Library | pub.dev Package | Purpose |
|---|---|---|
| **image_picker** | `image_picker` | Access device camera and photo gallery to capture donation item images |
| **file_picker** | `file_picker` | Allow NGOs to upload PDF or image verification documents |
| **url_launcher** | `url_launcher` | Open external URLs, dial phone numbers, or launch map applications |

### UI & Visualization

| Library | pub.dev Package | Purpose |
|---|---|---|
| **Cupertino Icons** | `cupertino_icons` | iOS-style icon set for native feel on Apple devices |
| **fl_chart** | `fl_chart` | Highly customizable Flutter charting library for donation impact analytics |

`fl_chart` renders line graphs and bar charts in the `NGOAnalyticsTab` and Donor impact dashboards, showing donation trends and fulfillment rates over time.

---

## Feature Modules

The app is organized into **feature-based modules** under `lib/features/`. Each feature owns its screens, widgets, and local logic. This keeps code for unrelated features fully isolated.

### `auth/`
- **Login screen** — Email/password form with JWT retrieval.
- **Registration screen** — Role selection (Donor or NGO), profile details.
- Stores the JWT access token securely on-device for subsequent requests.

### `home/`
- Welcome/landing screens shown before authentication.
- Directs users to login or register.

### `donor/`
The most feature-rich module. Contains:
- **Donor Dashboard** — Active donations, pickup statuses, eco-impact summary.
- **Camera Scan Flow** — Triggers `image_picker`, uploads to `/api/v1/detection/analyze`, renders a review cart of detected items.
- **Donation History** — Paginated list of past donations with status badges.
- **Match Results** — Shows NGO match cards with score breakdowns.
- **Pickup Tracker** — Real-time lifecycle view (Scheduled → In Transit → Delivered).

### `ngo/`
- **NGO Dashboard** — Demand list, match recommendations, fulfillment metrics.
- **Demand Creation** — Form to publish a new item demand with priority, quantity, and deadline.
- **Verification Status** — Shows the NGO's current verification state and any admin feedback.
- **NGO Analytics Tab** — `fl_chart` visualizations of match rates and donation volumes.

### `dashboard/`
- Shared tab scaffold using `IndexedStack` to maintain screen state across tab switches without unnecessary widget rebuilds.

---

## Core Infrastructure

### `core/config/` — API Configuration

`ApiConfig` holds the backend base URL and performs **automatic environment detection**:

```dart
// Android Emulator cannot reach localhost — must use 10.0.2.2
static String get baseUrl {
  if (Platform.isAndroid && kDebugMode) {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
}
```

This means local development works out-of-the-box on both Android Emulator and iOS Simulator without manual URL changes.

### `core/network/api_client.dart` — HTTP Wrapper

Responsibilities:
- Attaches `Authorization: Bearer <token>` to every request.
- Parses the standard `{ "success": bool, "data": ..., "message": ... }` response envelope.
- Handles 401 responses (triggers re-authentication flow).
- Applies a global request timeout.
- Throws typed exceptions for network errors and API error responses.

### `core/theme/` — Design System

Defines `ThemeData`, custom color palette, typography scale, and component defaults used consistently across all screens.

---

## Routing & Navigation

The app uses Flutter's built-in `Navigator` with **named routes** configured in `app/`. Primary dashboards use an `IndexedStack` layout to manage the tab bar, which:
- Maintains widget state across tab switches (avoids re-fetching data on every tab change).
- Preserves scroll positions within each tab.
- Is significantly more performant than destroying and recreating screens on every navigation.

---

## Camera & Hardware Integration

The Donor camera scan flow is a core feature of the mobile app:

```
Donor taps "Scan Items"
    → image_picker opens native camera or photo gallery
    → Selected image compressed to JPEG (reduces upload payload)
    → Image sent as multipart/form-data to POST /api/v1/detection/analyze
    → Backend returns list of detected items with confidence scores
    → App renders editable item review screen
    → Donor confirms items → POST /api/v1/donations
    → Donation created, user navigated to match results screen
```

**Permission handling:** `image_picker` on both platforms requires camera and photo library permissions declared in `android/AndroidManifest.xml` and `ios/Info.plist` respectively. These are already configured — do not remove these permission entries.

---

## API Communication

The mobile app hits the **exact same FastAPI backend** as the web frontend. There is no mobile-specific API — every endpoint the app uses is the same `/api/v1/*` endpoint the web app uses.

| Feature | API Endpoint |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Register | `POST /api/v1/auth/register` |
| Image Detection | `POST /api/v1/detection/analyze` |
| Create Donation | `POST /api/v1/donations` |
| Get Donor Donations | `GET /api/v1/donations` |
| Get Matches | `GET /api/v1/matching` |
| Accept Match | `PUT /api/v1/matching/{id}/accept` |
| NGO Demands | `GET/POST /api/v1/ngos/demands` |
| Schedule Pickup | `POST /api/v1/pickups` |
| Notifications | `GET /api/v1/notifications` |

---

## Core Workflows

### 1. Cross-Platform Routing

The app uses an `IndexedStack` layout for primary dashboards to maintain state across different tabs without unnecessary rebuilds (e.g., swapping between Demands, Matches, and Analytics within the NGO dashboard).

### 2. Camera Integration

Taps into the native camera via `image_picker`, compresses the image, and streams it as a multipart payload to the backend's `/api/v1/detection/analyze` endpoint. The response is displayed as an editable cart where the donor can review, modify, or remove items before finalizing the donation.

### 3. Environment Adaptation

The `ApiConfig` setup automatically detects if the app is running on an Android Emulator and switches the backend URL from `localhost` to `10.0.2.2` — the emulator's alias for the host machine. This ensures seamless local development without any manual configuration.

---

## Local Development Setup

### Prerequisites

- Flutter SDK (stable channel, ≥ 3.x)
- Android Studio (for Android Emulator) or Xcode (for iOS Simulator)
- Backend running at `http://localhost:8000` (or `http://10.0.2.2:8000` from Android emulator)

### Steps

```bash
# Navigate to the mobile frontend directory
cd mobile_frontend

# Install Flutter dependencies
flutter pub get

# Run on connected device or emulator
flutter run

# Run on a specific device (list available with: flutter devices)
flutter run -d <device_id>

# Build release APK (Android)
flutter build apk --release

# Build release IPA (iOS — requires macOS + Xcode)
flutter build ipa --release
```

### Verify Connection to Backend

1. Start the backend: `uvicorn app.main:app --reload --port 8000` (from `backend/`).
2. On Android Emulator: confirm `ApiConfig.baseUrl` resolves to `http://10.0.2.2:8000/api/v1`.
3. On iOS Simulator: confirm it resolves to `http://localhost:8000/api/v1`.
4. Open the Flutter app and attempt login — a successful JWT response confirms connectivity.

---

## Developer Notes & Gotchas

**Android Emulator cannot reach `localhost`.**
Always use `10.0.2.2` as the host when running on Android Emulator. `ApiConfig` handles this automatically in debug mode, but verify if you change how the base URL is resolved.

**Never call `http` directly in feature code.**
All network calls must go through `ApiClient`. This ensures JWT headers, error handling, and response envelope parsing are applied consistently.

**`IndexedStack` keeps all tabs alive.**
This is intentional for UX (preserves scroll state). If a tab has expensive initialization, consider using lazy loading within that tab rather than mounting it eagerly.

**Camera permissions must be declared.**
Do not remove the `NSCameraUsageDescription` (iOS) or `CAMERA` permission (Android) from the platform config files — `image_picker` will crash without them.

**pubspec.yaml asset declarations.**
Any new image or font assets added to the `assets/` folder must be explicitly declared in `pubspec.yaml` under the `flutter: assets:` section, otherwise Flutter will not bundle them.

**Hot reload vs. hot restart.**
Flutter's hot reload (`r`) preserves app state. Hot restart (`R`) resets state. If you change `main.dart` or global providers, use hot restart to see changes correctly.
