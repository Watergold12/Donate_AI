# 🔧 Remaining Tasks — Make Frontend & Backend Broken-Free

After a thorough audit of every file in both `frontend/` and `backend/`, here's the complete list of issues preventing clean compilation, runtime, and proper integration. **No new features or UI changes** — only fixes.

---

## 🟥 CRITICAL — Won't Compile / Will Crash

### 1. Tailwind v4 + `tailwind.config.js` Conflict
**Files:** [tailwind.config.js](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/tailwind.config.js), [index.css](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/index.css), [vite.config.ts](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/vite.config.ts), [postcss.config.js](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/postcss.config.js)

You're running **Tailwind CSS v4** (`@tailwindcss/vite`, `@tailwindcss/postcss`, `tailwindcss` all at `^4.3.2`), but you have a **Tailwind v3-style `tailwind.config.js`** with `darkMode: 'class'`, `content`, `theme.extend`, etc. Tailwind v4 does NOT use `tailwind.config.js` — it uses CSS-based configuration with `@theme {}` directives (which you partially have in `index.css`).

**Also:** You're loading Tailwind via **both** the Vite plugin (`@tailwindcss/vite`) AND PostCSS plugin (`@tailwindcss/postcss`). You must pick one.

**Fix options:**
- **Option A (recommended):** Delete `tailwind.config.js` and `postcss.config.js`. Keep only `@tailwindcss/vite` in `vite.config.ts`. Your `index.css` already has the `@theme {}` block with all design tokens.
- **Option B:** Downgrade to Tailwind v3 if you want to keep the JS config file approach.

> [!CAUTION]
> This is the #1 blocker. The `darkMode: 'class'` config in `tailwind.config.js` does nothing in v4 and may cause build errors or silent CSS failures.

---

### 2. Frontend `.env` Contains Backend-Only Variables
**File:** [frontend/.env](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/.env)

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
DATABASE_URL=postgresql://postgres:123456@localhost:5432/donation_db
SECRET_KEY=pGNG-IsbBSH-nrNJzvWP8w6y9FWw6fOMaNnGY4PNcuA
USE_MOCK_DETECTOR=true
```

`DATABASE_URL`, `SECRET_KEY`, and `USE_MOCK_DETECTOR` are **backend secrets** that should NOT be in the frontend `.env`. They get bundled into the client-side JS by Vite (non-`VITE_` prefixed vars are ignored, but it's still a bad practice and confusing). Clean it up.

**Fix:** Remove everything except `VITE_API_BASE_URL` from `frontend/.env`.

---

### 3. Backend `database.py` — Unused `event` Import
**File:** [database.py](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/backend/app/database.py#L8)

```python
from sqlalchemy import create_engine, event  # `event` is imported but never used
```

**Fix:** Remove `event` from the import.

---

### 4. Backend `config.py` — Unused `field_validator` Import
**File:** [config.py](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/backend/app/config.py#L9)

```python
from pydantic import field_validator  # imported but never used
```

**Fix:** Remove the unused import.

---

## 🟧 HIGH — Runtime Bugs / Incorrect Behavior

### 5. `AdminUsersPage` — `formatDate(u.id)` Is Wrong
**File:** [AdminUsersPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/admin/AdminUsersPage.tsx#L96)

```tsx
<td className="px-6 py-3 text-[#6B7280]">{formatDate(u.id)}</td>
```

`u.id` is a UUID string, not a date. The `User` type has no `created_at` field, so the "Joined" column will display `Invalid Date`.

**Fix:** Either add `created_at` to the `User` type (backend already likely sends it) or remove the column.

---

### 6. `AdminNGOsPage` — `formatDate(ngo.id)` Is Wrong
**File:** [AdminNGOsPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/admin/AdminNGOsPage.tsx#L73)

```tsx
<p className="text-xs text-gray-400">Applied {formatDate(ngo.id)}</p>
```

Same issue — `ngo.id` is a UUID, not a date. Will display `Invalid Date`.

**Fix:** Use a proper date field (e.g., add `created_at` to the `NGOProfile` type).

---

### 7. `SettingsPage` — Form Fields Are Visually Hidden But Not Functional
**File:** [SettingsPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/shared/SettingsPage.tsx#L48)

The form `<form ... className="sr-only" aria-hidden="true">` is screen-reader-only and hidden. The `register` function alias is `_reg` (unused). The `errors` alias is `_err` (unused). The `onSubmit` just waits 500ms and shows "saved" — it doesn't actually call any API. The "Addresses" and "Notifications" menu items have empty action handlers (`() => {}`).

**Fix:** Either wire `onSubmit` to a real profile-update API endpoint, or remove the form entirely if it's not needed yet. At minimum, remove the unused `_reg` / `_err` variables.

---

### 8. `LoginPage` & `RegisterPage` — Sidebar Shown on Auth Pages
**Files:** [LoginPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/auth/LoginPage.tsx#L39-L41), [RegisterPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/auth/RegisterPage.tsx#L66-L68)

Both pages render `<Sidebar role="donor" />` hardcoded inside an `<aside>`. This shows the donor sidebar navigation (with nav links to `/donor`, `/donor/camera`, etc.) on the login/register pages, where the user is **not authenticated**. Clicking those links would redirect to `/login` via `RequireAuth`.

**Fix:** Either remove the sidebar from auth pages entirely (these are guest pages), or use a simplified brand sidebar that only shows the logo without navigation links.

---

### 9. Navbar `refreshToken` Destructured from AuthContext — Minor
**File:** [Navbar.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/components/organisms/Navbar.tsx#L9)

```tsx
const { user, clearAuth, refreshToken, isAuthenticated } = useAuthContext()
```

`refreshToken` is correctly part of `AuthState`, so this compiles. But the logout handler in Navbar duplicates the logic from `useAuth().logout`. Consider using the hook instead.

---

### 10. `DonationPage` — Shows Only `is_confirmed` Items, New Items May Not Show
**File:** [DonationPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/donor/DonationPage.tsx#L139-L143)

```tsx
{donation.items.filter(i => i.is_confirmed).length === 0 ? (
  <p>No items yet — click Add Item to start.</p>
) : (
  donation.items.filter(i => i.is_confirmed).map(...)
)}
```

Items added via `addItem` have `is_confirmed` coming from the backend response. If the backend defaults `is_confirmed = false`, newly added items will **never appear** in the list until something confirms them. This could make the page appear broken.

**Fix:** Verify the backend `DonationItem` model's default for `is_confirmed`. If it defaults to `false`, either remove the filter or change the default to `true`.

---

## 🟨 MEDIUM — Integration / Wiring Issues

### 11. Backend `alembic` — Migrations May Not Be Up To Date
**Directory:** [alembic/](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/backend/alembic)

There's an `alembic` directory and `alembic.ini`, but we haven't verified:
- Whether the initial migration exists
- Whether `alembic upgrade head` has been run against the database
- Whether the database `donation_db` has been created

**Fix:** Document the setup steps. Run `alembic upgrade head` before starting the backend.

---

### 12. Backend `models/best.pt` — YOLO Model File
**Config:** `MODEL_PATH=./models/best.pt` with `USE_MOCK_DETECTOR=true`

The `models/` directory exists in the backend, but likely doesn't contain `best.pt` (the YOLO weights file). This is fine because `USE_MOCK_DETECTOR=true` means the mock detector is used, but if someone sets `USE_MOCK_DETECTOR=false`, it will fall back to mock anyway with a warning.

**Fix:** Add a note in README / `.env.example` that `models/best.pt` must be provided if using the real detector.

---

### 13. No `@` Path Alias in `tsconfig.app.json`
**Files:** [vite.config.ts](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/vite.config.ts#L12-L14), [tsconfig.app.json](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/tsconfig.app.json)

`vite.config.ts` defines `"@": path.resolve(__dirname, "./src")` as an alias, but the code never uses `@/` imports — all imports use relative paths. However, `tsconfig.app.json` probably doesn't have matching `paths` config, so if anyone starts using `@/` imports, TypeScript will error.

**Fix:** Either add `paths` to `tsconfig.app.json` to match, or remove the alias from `vite.config.ts` since it's unused.

---

### 14. `templates/index.ts` — Empty Barrel File
**File:** [templates/index.ts](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/components/templates/index.ts)

```ts
// barrel exports
```

It doesn't export `DashboardLayout` or `AuthLayout`, though all pages import them directly. Not a blocker, but incomplete.

**Fix:** Add exports: `export { DashboardLayout } from './DashboardLayout'` and `export { AuthLayout } from './AuthLayout'`

---

### 15. Backend `.env` Contains `VITE_API_BASE_URL`
**File:** [backend/.env](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/backend/.env#L1)

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

This is a frontend variable that does nothing in the backend. It pollutes the environment.

**Fix:** Remove `VITE_API_BASE_URL` from `backend/.env`.

---

## 🟦 LOW — Code Quality / Cleanup

### 16. `DonationHistoryPage` Uses `donationsApi.listMine` Not `history`
**File:** [DonationHistoryPage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/donor/DonationHistoryPage.tsx#L35)

The page is named "DonationHistory" but calls `donationsApi.listMine()` instead of `donationsApi.history()`. Both hit different backend endpoints (`/donors/donations` vs `/donors/history`). The hook `useDonationHistory` (in `hooks/useDonations.ts`) correctly calls `donationsApi.history()` but is never used.

**Fix:** Decide which endpoint is correct for the history page and use it consistently. The page currently duplicates what the donor dashboard already shows.

---

### 17. Unused Hooks
**File:** [hooks/index.ts](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/hooks/index.ts)

Several exported hooks are never imported by any page:
- `useDonations`, `useDonationHistory` — pages do inline API calls instead
- `useUnreadCount`, `useNotifications` — `NotificationBell` does its own inline API calls
- `useSummary`, `useTrend`, `useCategories`, `usePickupStats` — analytics pages do inline API calls

This isn't a bug, but it's dead code that adds confusion.

**Fix:** Either refactor pages to use the hooks, or remove the unused hooks.

---

### 18. `zod` v4 Compatibility
**File:** [package.json](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/package.json#L24)

```json
"zod": "^4.4.3"
```

You're using Zod v4. The `@hookform/resolvers` package at `^5.4.0` may or may not support Zod v4 (it was built for Zod v3). If form validation breaks, this is why.

**Fix:** Test form validation (login, register, donation, demands). If it works, fine. If not, either pin `zod` to v3 or update `@hookform/resolvers` to a version that supports Zod v4.

---

### 19. `PickupSchedulePage` — Unused `address` State Initialization
**File:** [PickupSchedulePage.tsx](file:///d:/volume_e_files/Projects/React/Infosys_AI_Donation_platform/frontend/src/pages/donor/PickupSchedulePage.tsx#L26)

```tsx
const [address, setAddress] = useState(user?.full_name ? '' : '')
```

The ternary `user?.full_name ? '' : ''` always evaluates to `''`. This is a no-op.

**Fix:** Simplify to `useState('')` or pre-fill with an actual address field.

---

### 20. `DonorPickupsPage` — `PickupStatus` Type Not Used for `UPDATABLE_STATUSES`
Not an error, but the `PickupStatus` type is imported but only used in the type annotation of `PIPELINE` (which is inline). Clean typing.

---

## 📋 Summary of All Tasks

| #  | Priority | Task | Files Affected |
|----|----------|------|----------------|
| 1  | 🟥 CRITICAL | Fix Tailwind v4 config conflict (delete `tailwind.config.js` + `postcss.config.js`, keep only Vite plugin) | `tailwind.config.js`, `postcss.config.js`, `vite.config.ts` |
| 2  | 🟥 CRITICAL | Clean `frontend/.env` — remove backend secrets | `frontend/.env` |
| 3  | 🟥 CRITICAL | Remove unused `event` import in `database.py` | `backend/app/database.py` |
| 4  | 🟥 CRITICAL | Remove unused `field_validator` import in `config.py` | `backend/app/config.py` |
| 5  | 🟧 HIGH | Fix `formatDate(u.id)` → use a real date field | `AdminUsersPage.tsx` |
| 6  | 🟧 HIGH | Fix `formatDate(ngo.id)` → use a real date field | `AdminNGOsPage.tsx` |
| 7  | 🟧 HIGH | Fix SettingsPage — remove unused form code or wire to API | `SettingsPage.tsx` |
| 8  | 🟧 HIGH | Remove Sidebar from LoginPage & RegisterPage (guest pages shouldn't have nav) | `LoginPage.tsx`, `RegisterPage.tsx` |
| 9  | 🟧 HIGH | Check `DonationItem.is_confirmed` default — items may not render | `DonationPage.tsx`, backend model |
| 10 | 🟨 MEDIUM | Document / run Alembic migrations | `alembic/` |
| 11 | 🟨 MEDIUM | Remove `VITE_API_BASE_URL` from `backend/.env` | `backend/.env` |
| 12 | 🟨 MEDIUM | Fix or remove `@` alias from `vite.config.ts` + `tsconfig.app.json` | `vite.config.ts`, `tsconfig.app.json` |
| 13 | 🟨 MEDIUM | Populate `templates/index.ts` barrel exports | `templates/index.ts` |
| 14 | 🟦 LOW | Fix `DonationHistoryPage` to use correct API endpoint | `DonationHistoryPage.tsx` |
| 15 | 🟦 LOW | Remove or use the unused hooks | `hooks/` |
| 16 | 🟦 LOW | Verify `zod` v4 + `@hookform/resolvers` v5 compatibility | `package.json` |
| 17 | 🟦 LOW | Fix no-op ternary in `PickupSchedulePage` | `PickupSchedulePage.tsx` |

## Open Questions

> [!IMPORTANT]
> **Q1:** For the auth pages (Login/Register), should I remove the Sidebar entirely and use a simpler layout, or keep the brand strip without navigation links?

> [!IMPORTANT]
> **Q2:** For `AdminUsersPage` and `AdminNGOsPage`, the `User` and `NGOProfile` types don't have a `created_at` field. Should I add `created_at` to both frontend types (assuming backend sends it), or just remove those "Joined" / "Applied" columns?

> [!IMPORTANT]
> **Q3:** Should I delete the unused custom hooks (`useDonations`, `useDonationHistory`, `useAnalytics`, etc.) since all pages do inline API calls, or refactor the pages to use them?

## Verification Plan

### Manual Verification
1. Run `npm run dev` in frontend — confirm no build errors
2. Run `uvicorn app.main:app` in backend — confirm no import errors
3. Navigate to every route and verify no crashes
4. Test login → dashboard → camera → donation flow end-to-end
