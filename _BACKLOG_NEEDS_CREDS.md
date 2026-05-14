# Backlog: Needs Credentials — AIHomeRenovationProjectManager

This file tracks features stubbed during audit apply pass 5 that require
external provider credentials before they can be wired up. Each route in
`server/routes/integrations.js` returns 503 with a `missing_env` array until
the corresponding env vars are set.

## Stripe — payment processing
- **Endpoint:** `POST /api/integrations/stripe/charge`
- **Env:** `STRIPE_SECRET_KEY`
- **Wire-up TODO:** Create PaymentIntent against Stripe API; persist
  `payment_intent_id` to the `payments` table; webhook for status updates.

## Twilio — homeowner SMS
- **Endpoint:** `POST /api/integrations/twilio/sms`
- **Env:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Wire-up TODO:** POST to Twilio Messages API with project-scoped sender
  identity. Add unsubscribe handling.

## Material price feed (Home Depot Pro / Lowe's ProDesk / RS Means)
- **Endpoint:** `GET /api/integrations/material-feed/price/:sku`
- **Env:** `MATERIAL_FEED_PROVIDER`, `MATERIAL_FEED_API_KEY`
- **Wire-up TODO:** Implement provider-specific adapters; cache by SKU+region;
  feed pricing into the existing `/api/materials/ai/cost-estimate` endpoint.

## Permit office (Accela / Tyler / municipal)
- **Endpoint:** `GET /api/integrations/permits/lookup/:permit_no`
- **Env:** `PERMIT_PROVIDER`, `PERMIT_API_KEY`, `PERMIT_JURISDICTION`
- **Wire-up TODO:** Authenticate against jurisdiction's permit API; map status
  codes to local schema.

## Backlog items NOT mechanical (still deferred)

- **Lien management** — needs jurisdiction-specific legal workflow
  (NEEDS-PRODUCT-DECISION); no mechanical baseline this pass.
- **Contractor/supplier marketplace** — bulk product/listings UI scope
  (NEEDS-PRODUCT-DECISION).
- **Vision-based progress tracking** — `queryAIVision` already exists; product
  decision needed on photo cadence + snapshot diffing rules
  (NEEDS-PRODUCT-DECISION).
- **Agentic project coordinator** — autonomy scope must be bounded by product
  (TOO-RISKY without explicit limits).
