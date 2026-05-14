/*
 * routes/integrations.js — Apply pass 5
 *
 * 503-on-no-key stub endpoints for third-party integrations called out in the
 * audit's "missing non-AI features" and "custom feature suggestions" lists for
 * AIHomeRenovationProjectManager. Each endpoint requires JWT auth (matches the
 * project convention) and returns 503 with a structured payload when the
 * provider env vars are missing. When credentials are present the handler
 * returns a TODO marker so callers know the wire-up still needs implementing.
 *
 * Reference: /Users/erolakarsu/projects/quickbooks/routes/ai.js (503-no-key
 * pattern).
 */

const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

function requireEnv(req, res, providerName, vars) {
  const missing = vars.filter((v) => !process.env[v] || process.env[v].startsWith('your_'));
  if (missing.length) {
    res.status(503).json({
      error: 'integration_not_configured',
      provider: providerName,
      missing_env: missing,
      message: `${providerName} integration is not configured. Set ${missing.join(', ')} to enable this endpoint.`,
    });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Stripe — payment processing
// Env: STRIPE_SECRET_KEY
// ---------------------------------------------------------------------------
router.post('/stripe/charge', auth, async (req, res) => {
  if (!requireEnv(req, res, 'Stripe', ['STRIPE_SECRET_KEY'])) return;
  // TODO(creds): Implement Stripe PaymentIntent creation against
  //   process.env.STRIPE_SECRET_KEY using the existing axios/node-fetch
  //   helper. Persist the resulting payment_intent_id to the payments table.
  res.json({
    status: 'stub_with_creds',
    note: 'Stripe key present but wire-up TODO. See _BACKLOG_NEEDS_CREDS.md.',
    requested: req.body,
  });
});

// ---------------------------------------------------------------------------
// Twilio — homeowner SMS updates
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
// ---------------------------------------------------------------------------
router.post('/twilio/sms', auth, async (req, res) => {
  if (!requireEnv(req, res, 'Twilio', [
    'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER',
  ])) return;
  // TODO(creds): POST to https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
  res.json({
    status: 'stub_with_creds',
    note: 'Twilio creds present but wire-up TODO. See _BACKLOG_NEEDS_CREDS.md.',
    requested: req.body,
  });
});

// ---------------------------------------------------------------------------
// Material price feed (e.g., Home Depot supplier API, Lowe's, regional)
// Env: MATERIAL_FEED_PROVIDER, MATERIAL_FEED_API_KEY
// ---------------------------------------------------------------------------
router.get('/material-feed/price/:sku', auth, async (req, res) => {
  if (!requireEnv(req, res, 'MaterialPriceFeed', [
    'MATERIAL_FEED_PROVIDER', 'MATERIAL_FEED_API_KEY',
  ])) return;
  // TODO(creds): Call configured material price feed (Home Depot Pro / Lowe's
  //   ProDesk / RS Means) and return realtime price + lead time.
  res.json({
    status: 'stub_with_creds',
    sku: req.params.sku,
    note: 'Provider configured but wire-up TODO. See _BACKLOG_NEEDS_CREDS.md.',
  });
});

// ---------------------------------------------------------------------------
// Permit office (Accela / Tyler / municipal API)
// Env: PERMIT_PROVIDER, PERMIT_API_KEY, PERMIT_JURISDICTION
// ---------------------------------------------------------------------------
router.get('/permits/lookup/:permit_no', auth, async (req, res) => {
  if (!requireEnv(req, res, 'PermitOffice', [
    'PERMIT_PROVIDER', 'PERMIT_API_KEY', 'PERMIT_JURISDICTION',
  ])) return;
  res.json({
    status: 'stub_with_creds',
    permit_no: req.params.permit_no,
    note: 'Permit office configured but wire-up TODO. See _BACKLOG_NEEDS_CREDS.md.',
  });
});

module.exports = router;
