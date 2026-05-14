# Audit Apply Notes — AIHomeRenovationProjectManager

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 23.

Note: audit reported "0 AI endpoints"; actually substantial AI integration already exists via `services/openrouter.js` (text + vision) and per-domain `/ai/...` sub-routes:
- `POST /api/budget/ai/analyze`, `POST /api/budget/ai/variance-predict`
- `POST /api/contractors/ai/match`, `POST /api/contractors/ai/vet/:id`, `POST /api/contractors/compare-bids`, `GET /api/contractors/ai/history`
- `POST /api/inspections/ai/prepare`
- `POST /api/materials/ai/optimize`
- `POST /api/timeline/ai/optimize`, `POST /api/timeline/ai/conflicts`
- `POST /api/photos/ai-describe`
- AI sub-routes also exist on permits, designs, projects, rooms

The per-domain `/ai` rate limiter is already registered in `server/index.js`, so new sub-paths inherit it.

## Original Recommendations (AI Counterparts) — mapped to reality
- `/timeline-predictor` — distinct from existing `/optimize`. ADDED.
- `/budget-optimizer` — already covered by `/api/budget/ai/analyze` + `/variance-predict`.
- `/contractor-recommendation` — already covered by `/api/contractors/ai/match`.
- `/material-cost-estimator` — distinct from `/optimize` (which compares existing items). ADDED.
- `/inspection-insight` — distinct from `/prepare` (which is pre-inspection). ADDED for post-inspection analysis.
- `/schedule-conflict-detector` — already covered by `/api/timeline/ai/conflicts`.

## Implemented (this pass)
- `POST /api/timeline/ai/predict` — calibrated P50/P90 timeline prediction with per-phase durations, risk factors, and shortening actions. (server/routes/timeline.js)
- `POST /api/materials/ai/cost-estimate` — itemized regional materials estimate with low/mid/high totals and substitutions. (server/routes/materials.js)
- `POST /api/inspections/ai/insight` — analyze a completed inspection record, return severity, code refs, remediation plan, cost band, re-inspection timing. (server/routes/inspections.js)

All three use the existing `queryAI` helper, follow the established route style, and inherit the AI rate limiter mounted in `server/index.js`.

Syntax: `node --check` passes for all three modified files.

## Backlog
- Non-AI: payment processing, lien management, change-order management, contractor/supplier marketplace, homeowner messaging.
- Custom: agentic project coordinator, vision-based progress tracking (could leverage existing `queryAIVision`), change-order AI advisor, contractor performance scoring, supply chain optimization, lien automation.

## Categorization
- MECHANICAL: 3 endpoints (done).
- NEEDS-PRODUCT-DECISION: change-order AI advisor (workflow/approval design), contractor performance metrics.
- NEEDS-CREDS: payment processing, supply-chain price feeds.

## Apply pass 3 (frontend)

Action: LEFT-AS-IS — frontend already wired to backend AI endpoints with JWT Bearer auth from localStorage. No idempotent changes required. See `_AUDIT/apply3_logs/ab3_66.md`.

## Apply pass 4 (mechanical backlog)

Action: NO-OP. The 3 mechanical AI endpoints identified in the original audit (`/timeline/ai/predict`, `/materials/ai/cost-estimate`, `/inspections/ai/insight`) were already implemented in pass 2. Remaining backlog is entirely:
- NEEDS-CREDS: payment processing, supply-chain price feeds.
- NEEDS-PRODUCT-DECISION: change-order AI advisor (workflow/approval design), contractor performance metrics.
- Non-AI infra (lien management, marketplace, messaging) — out of scope for an LLM-helper-based mechanical pass.

No code changes this pass.
