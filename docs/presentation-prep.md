# Final Presentation Prep

This is the demo and handoff guide for the AI Donation Management Platform. Use it to prepare for the project presentation and as a checklist before any live demo.

---

## Pre-Demo Checklist

Run through this checklist **before** the presentation to avoid surprises:

- [ ] Backend running: `uvicorn app.main:app --reload --port 8000` (in `backend/`)
- [ ] Frontend running: `npm run dev` (in `frontend/`)
- [ ] PostgreSQL database connected and responding
- [ ] At least one **Donor** account created and ready
- [ ] At least one **verified NGO** with at least one active demand created
- [ ] At least one **donation** in matching or scheduled state
- [ ] At least one **Admin** account available for the verification demo
- [ ] Startup logs confirm: `AI detector` and `Semantic embedding service` both loaded
- [ ] Browser camera permission granted (for the detection scan demo)
- [ ] API health check passes: `curl http://localhost:8000/health`

---

## Suggested Demo Flow

Walk through this sequence to cover all major platform capabilities in a logical, story-driven order:

### Act 1: Donor Experience (AI Detection & Donation)
1. Open the **Donor Dashboard** and give a quick orientation of the layout.
2. Click **"Scan Items"** to open the camera scanner.
3. Capture or upload an image of a donation item (books, clothing, or electronics work well).
4. Show the AI detection results — item categories, confidence scores, and bounding boxes.
5. Demonstrate the **interactive cart**: edit quantities, add a description note (e.g., *"grade 10 math textbook, good condition"*), remove an item.
6. Submit the donation and show the **packaging checklist** and acknowledgement step.
7. Schedule a pickup — select a slot, enter address, add special instructions.

### Act 2: NGO Experience (Matching & Acceptance)
8. Switch to the **NGO Dashboard** (log in as the verified NGO account).
9. Show the **Demand Portal** — open the demand creation modal and explain priority levels.
10. Open the **AI Match Recommendations** feed — show the matched donation cards.
11. Expand a match card to show the **score breakdown** (category %, urgency weight, semantic similarity %).
12. Accept a match — show how the donation transitions to the NGO's fulfillment pipeline.

### Act 3: Admin Experience (Verification)
13. Log in as an **Admin**.
14. Open the **NGO Verification queue** — show a Pending NGO submission.
15. Review the NGO details and demonstrate **Approve / Reject** action.
16. Show the **audit log** entry created for the admin action.
17. Show the **System Dashboard** — platform-wide donation volume, match rates, and active pickups.

### Act 4: Analytics & Impact
18. Return to the **Donor Dashboard** and open the impact summary: CO₂ reduction estimate and landfill waste diverted.
19. Open the **NGO Analytics tab** — show line graphs of fulfillment rates and donation volumes over time.

---

## Key Talking Points

| Theme | Talking Point |
|---|---|
| **Problem** | Donations move slowly because item identification, NGO matching, and pickup coordination are all done manually — causing delays and mismatches. |
| **AI Detection** | YOLOv8 replaces manual item cataloging. A donor points their camera at a pile of items and the system identifies and labels everything automatically in seconds. |
| **Intelligent Matching** | The matching engine doesn't just filter by category — it uses vector-based NLP similarity to match a donor's description of *"warm winter jacket"* with an NGO's demand for *"cold weather clothing"*, even without exact keyword overlap. |
| **Transparency** | Every match shows a full score breakdown: category match %, quantity fit, distance fit, urgency weight, and semantic similarity %. Donors and NGOs know exactly *why* a match was recommended. |
| **Resilience** | If YOLO model weights are missing or the embedding model fails to load, fallback logic activates automatically. The entire donor workflow continues without interruption. |
| **Lifecycle** | The platform doesn't stop at matching — it follows the donation from scan → packaging guidance → pickup scheduling → real-time delivery tracking → impact analytics. |
| **Notifications** | Every key event (match found, match accepted, pickup scheduled, delivery complete) triggers in-app notifications. The system is designed for future email, SMS, and webhook expansion. |

---

## Short Problem / Solution Story

**Problem:**
- Donation management is still largely manual at most NGOs — item identification is done by hand, matching is based on informal knowledge, and pickup coordination is ad-hoc.
- This causes delays, mismatches (wrong items sent to wrong NGOs), and wasted resources.

**Solution:**
- The platform automates item capture with computer vision, recommends optimal NGO matches using semantic AI, and tracks the entire delivery journey in one place — reducing the time from *"I want to donate"* to *"Items delivered"* from days to hours.

---

## Backup Plan (If a Live Demo Step Fails)

If any step in the live demo fails unexpectedly:

1. **Backend error** → Point to the Swagger UI at `http://localhost:8000/docs` and demonstrate the API directly.
2. **AI detection fails** → Explain that MockDetector is the fallback — trigger it manually by setting `USE_MOCK_DETECTOR=true` and restarting. Show the cart with mock results.
3. **Matching produces no results** → Manually trigger the matching engine via `POST /api/v1/matching-engine/run` from Swagger. Explain the fallback rule-based scorer activates if the embedding service is unavailable.
4. **Frontend crash** → Walk through the dashboard screens as screenshots or show the mobile app as a backup client.
5. **Database issue** → Show `conftest.py` test fixtures and run `pytest -v` to prove the system works correctly in isolation.

**The key message to preserve in any backup scenario:** The platform has been designed with graceful fallbacks at every critical point. AI failures do not stop the donation workflow.

---

## Post-Demo Handoff Notes

- All environment variable requirements are documented in `backend/.env.example` and `frontend/.env.example`.
- Database schema is fully managed via Alembic — any new deployment runs `alembic upgrade head`.
- Test suite covers all major API endpoints — run `pytest -v -s` from `backend/` to validate the system.
- Architecture documentation lives in `docs/` — start with `project-documentation.md` for the full overview.
- Open items for future development are listed at the bottom of `docs/project-documentation.md`.
