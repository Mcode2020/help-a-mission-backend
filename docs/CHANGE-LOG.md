# Backend Changelog

## 2026-10-05 — Standards and Security Hardening (feature)
- **Date**: 2026-10-05
- **Type**: security / architecture
- **Problem**: 
  - Express server lacks security headers (`helmet`), payload body size limits (`express.json({ limit })`), and has fingerprinting enabled (`x-powered-by`).
  - Routes lack clear public vs private separation.
  - Scattered `process.env` access across files without central validation.
  - Raw `console.*` calls in runtime code instead of structured redacting logger.
  - Missing automated tests for API health.
- **Design / Solution**:
  - Adopt 14-Level Clean Architecture and Express Guardian standards.
  - Install and configure `helmet` with security headers, disable `x-powered-by`.
  - Add explicit JSON payload limit (`100kb`).
  - Implement validated configuration module in `src/config/env.js`.
  - Implement Level 13 structured redacting logger in `src/security/logger.js`.
  - Reorganize routes into public route allow-list router under `src/routes/public/`.
  - Configure `.expressguard.json` declaring public routes.
  - Add native test suite for health check endpoint.
  - Add `.cursor/` to `.gitignore`.
- **Status**: done
- **Verified**:
  - `expressguard`: 0 critical, 0 high, 0 medium, 0 low (PASS)
  - `npm test`: 3/3 tests passed (native node test runner + supertest)
  - `verify-gate`: passed (`code_claim_allowed: true`)

## 2026-10-05 — Razorpay Payment Gateway & Domain Endpoints (feature)
- **Date**: 2026-10-05
- **Type**: feature / payment / domain
- **Problem**: 
  - Backend lacks payment gateway handling for donations in INR.
  - No public endpoints for campaigns, volunteer applications, or contact inquiries.
- **Design / Solution**:
  - Install `razorpay` and implement Level 12 modular payment gateway (`src/payment/razorpay.js`) with timing-safe HMAC verification (`crypto.timingSafeEqual`).
  - Implement Domain Services and HTTP Controllers:
    - Donations Domain: `create-order` and `verify` payment endpoints with 80G receipt generation.
    - Campaigns Domain: `GET /api/campaigns` and `GET /api/campaigns/:slug`.
    - Volunteers Domain: `POST /api/volunteers` application ingestion.
    - Contact Domain: `POST /api/contact` inquiry ingestion.
  - Mount public routes in `src/routes/index.js` and register in `.expressguard.json`.
  - Add Supertest test coverage for all new endpoints in `tests/api.test.js`.
- **Status**: done
- **Verified**:
  - `expressguard`: 0 critical, 0 high, 0 medium, 0 low (PASS)
  - `npm test`: 10/10 tests passed (health + campaigns + donations + volunteers + contact)
  - `verify-gate`: passed (`code_claim_allowed: true`)


