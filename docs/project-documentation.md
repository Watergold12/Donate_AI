# Project Documentation Pack

This document captures the current production-ready state of the donation platform and the main implementation choices completed so far.

## System Overview

The application is split into two primary parts:

- `backend/` provides the FastAPI service, business rules, persistence, and AI helpers.
- `frontend/` provides the React + TypeScript interface for donors, NGOs, and admins.

The platform supports:

- donor item cataloging using camera capture and image uploads
- NGO demand creation and verification
- rule-based and semantic donation matching
- pickup scheduling and delivery lifecycle tracking
- in-app notifications with optional external channel hooks
- dashboards for donors, NGOs, and admins

## Core Workflows

### Donor flow

1. Capture or upload an item image.
2. Run object detection and review detected items.
3. Add optional descriptions and quantities.
4. Submit a donation.
5. Review matches and packaging guidance.
6. Schedule pickup and follow the delivery status.

### NGO flow

1. Register the NGO profile.
2. Submit demands with item categories, quantities, and urgency.
3. Wait for match recommendations.
4. Accept or reject candidate matches.
5. Track pickup and completion status.

### Admin flow

1. Review NGO verification documents.
2. Approve, reject, or revoke authenticity where required.
3. Monitor system activity and platform metrics.

## Current Architecture Notes

- Detection uses a pretrained YOLO path with fallback detection so the donation flow still works if the model is unavailable.
- Matching combines rule-based scoring with semantic similarity.
- Semantic embeddings are generated with `sentence-transformers/all-MiniLM-L6-v2`.
- Notifications are persisted in-app first, with optional channel support.
- Donation lifecycle states now cover packaging guidance, acknowledgement, scheduling, and delivery progress.

## API Areas

The backend routes are grouped around:

- authentication
- donors and donations
- NGOs and demands
- matching
- pickups
- notifications
- admin verification and analytics

## Configuration Summary

Important environment values live in `backend/.env.example` and `frontend/.env.example`.

Common setup items include:

- database connection string
- JWT secret
- CORS origin list
- media path
- optional notification webhook endpoints
- optional AI model configuration

## Validation Approach

The project currently has lightweight validation through:

- backend unit and integration tests
- frontend production build checks
- startup loading for AI helpers so models are not reloaded per request

## Remaining Non-Document Work

The following milestone items are still intentionally open:

- end-to-end integration testing across the full workflow
- backend load and stress testing
- cross-browser validation and performance cleanup
- cloud deployment of the dashboard experience

