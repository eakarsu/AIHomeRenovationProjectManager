# Apply Pass 5 — AIHomeRenovationProjectManager

**Date:** 2026-05-08
**Project:** AIHomeRenovationProjectManager
**Stack:** Node-Express + React (CRA), Postgres `pg` pool, JWT bearer auth.
**Audit source:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` §23

## Verified-present (pre-existing AI work, no changes)

Pass 1-4 already implemented all 6 audit-flagged AI counterparts:

- `/api/timeline/ai/predict`, `/optimize`, `/conflicts`
- `/api/budget/ai/analyze`, `/variance-predict`
- `/api/contractors/ai/match`, `/vet/:id`, `/compare-bids`, `/ai/history`
- `/api/materials/ai/optimize`, `/ai/cost-estimate`
- `/api/inspections/ai/prepare`, `/ai/insight`
- `/api/photos/ai-describe` (vision)
- AI per-route limiter mounted in `server/index.js`

## Implemented this pass (5 items — at cap)

1. `POST /api/integrations/stripe/charge` — 503-on-no-key (`STRIPE_SECRET_KEY`).
2. `POST /api/integrations/twilio/sms` — 503-on-no-key (Twilio SID/token/from).
3. `GET  /api/integrations/material-feed/price/:sku` — 503-on-no-key
   (`MATERIAL_FEED_PROVIDER`, `MATERIAL_FEED_API_KEY`).
4. `GET  /api/integrations/permits/lookup/:permit_no` — 503-on-no-key
   (Accela/Tyler/municipal).
5. `GET  /api/performance/contractor/:id` (mechanical, deterministic) +
   `POST /api/performance/change-order/calc` (mechanical, deterministic).

Files written:
- `server/routes/integrations.js` (new)
- `server/routes/performance.js` (new)
- `server/index.js` (added two `app.use(...)` lines — additive only)
- `_BACKLOG_NEEDS_CREDS.md` (new)

Files NOT modified: any existing route, schema, or auth middleware.

## Categorization of remaining backlog

- **NEEDS-CREDS (stubbed with 503):** Stripe, Twilio, material price feed,
  permit office.
- **MECHANICAL (implemented):** contractor performance scoring,
  change-order delta calc.
- **NEEDS-PRODUCT-DECISION:** lien management, marketplace, vision progress
  tracking cadence, agentic coordinator autonomy bounds.
- **TOO-RISKY without product decisions:** agentic project coordinator,
  autonomous schedule rewriter.

## Smoke test outcome

`node --check` passes for all three modified/new files
(`server/index.js`, `server/routes/integrations.js`, `server/routes/performance.js`).
Boot smoke not run — no node_modules at top level (this project carries them
under `server/node_modules` only). New routes are additive; existing tests
unaffected.

## Cap

5 / 5 — no further additions this pass.
