/*
 * routes/performance.js — Apply pass 5
 *
 * Mechanical (no-LLM-required) contractor performance scoring + change-order
 * impact calculator. Both endpoints derive results from records already in the
 * project DB — no third-party calls, no AI helper, idempotent.
 *
 * - GET  /api/performance/contractor/:id    — deterministic perf score
 * - POST /api/performance/change-order/calc — change-order delta calculator
 *
 * Audit motivation (batch_04 §23):
 *   - Custom feature suggestion #4 — Contractor performance scoring
 *   - Custom feature suggestion #3 — Change-order AI advisor (mechanical
 *     baseline; AI explanations remain backlog).
 */

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// Contractor performance score (deterministic, no LLM)
// ---------------------------------------------------------------------------
router.get('/contractor/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid_id' });

    const contractor = await db.query('SELECT * FROM contractors WHERE id = $1', [id]);
    if (contractor.rows.length === 0) {
      return res.status(404).json({ error: 'contractor_not_found' });
    }
    const c = contractor.rows[0];

    // Pull related signals defensively — schema may evolve. Each query is
    // wrapped so a missing optional column does not 500 the whole endpoint.
    const safeQuery = async (sql, params = []) => {
      try { return (await db.query(sql, params)).rows; } catch (_) { return []; }
    };
    const [punch, daily, payments] = await Promise.all([
      safeQuery('SELECT status FROM punchlist WHERE contractor_id = $1', [id]),
      safeQuery('SELECT 1 FROM dailylog WHERE contractor_id = $1', [id]),
      safeQuery('SELECT amount, status FROM payments WHERE contractor_id = $1', [id]),
    ]);

    const punchTotal = punch.length;
    const punchClosed = punch.filter((p) => /complete|closed|done/i.test(String(p.status || ''))).length;
    const closeRate = punchTotal > 0 ? punchClosed / punchTotal : null;

    const baseRating = Number(c.rating) || 0; // 0-5
    const ratingComponent = (baseRating / 5) * 50; // weight 50

    const closeRateComponent = closeRate === null ? 25 : closeRate * 30; // weight 30
    const activityComponent = Math.min(daily.length, 30) * (10 / 30); // weight 10
    const insuranceComponent = c.insurance_verified ? 10 : 0; // weight 10

    const score = Math.round(
      ratingComponent + closeRateComponent + activityComponent + insuranceComponent,
    );

    let tier = 'unrated';
    if (score >= 85) tier = 'A';
    else if (score >= 70) tier = 'B';
    else if (score >= 55) tier = 'C';
    else if (score > 0) tier = 'D';

    const drivers = [];
    if (baseRating >= 4.5) drivers.push('high homeowner rating');
    if (closeRate !== null && closeRate >= 0.9) drivers.push('strong punch-list close rate');
    if (c.insurance_verified) drivers.push('insurance verified');
    if (closeRate !== null && closeRate < 0.5) drivers.push('low punch-list close rate (risk)');
    if (!c.insurance_verified) drivers.push('insurance not verified (risk)');

    res.json({
      contractor_id: id,
      tier,
      score,
      score_breakdown: {
        rating: Math.round(ratingComponent * 100) / 100,
        punch_close: Math.round(closeRateComponent * 100) / 100,
        activity: Math.round(activityComponent * 100) / 100,
        insurance: insuranceComponent,
      },
      drivers,
      sample_size: { punchlist: punchTotal, dailylog: daily.length, payments: payments.length },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Change-order delta calculator (deterministic)
// Input: { project_id?, baseline_budget, baseline_days,
//          changes: [{ description, cost_delta, days_delta, scope }] }
// ---------------------------------------------------------------------------
router.post('/change-order/calc', auth, (req, res) => {
  const {
    baseline_budget,
    baseline_days,
    changes,
    contingency_pct,
  } = req.body || {};

  if (!Array.isArray(changes) || changes.length === 0) {
    return res.status(400).json({ error: 'changes[] is required' });
  }
  const bb = Number(baseline_budget) || 0;
  const bd = Number(baseline_days) || 0;
  const contingency = Number(contingency_pct) || 0;

  const items = changes.map((ch, i) => {
    const cost_delta = Number(ch.cost_delta) || 0;
    const days_delta = Number(ch.days_delta) || 0;
    return {
      idx: i,
      description: String(ch.description || `Change #${i + 1}`),
      scope: ch.scope || null,
      cost_delta,
      days_delta,
      cost_pct_of_baseline: bb > 0 ? Math.round((cost_delta / bb) * 10000) / 100 : null,
      days_pct_of_baseline: bd > 0 ? Math.round((days_delta / bd) * 10000) / 100 : null,
    };
  });

  const total_cost_delta = items.reduce((s, x) => s + x.cost_delta, 0);
  const total_days_delta = items.reduce((s, x) => s + x.days_delta, 0);
  const new_budget = bb + total_cost_delta;
  const new_days = bd + total_days_delta;
  const recommended_contingency = Math.round(new_budget * (contingency / 100) * 100) / 100;

  let recommendation = 'approve';
  const reasons = [];
  if (bb > 0 && total_cost_delta / bb > 0.1) {
    recommendation = 'review';
    reasons.push('change exceeds 10% of baseline budget');
  }
  if (bd > 0 && total_days_delta / bd > 0.15) {
    recommendation = 'review';
    reasons.push('schedule impact exceeds 15% of baseline days');
  }
  if (total_cost_delta < 0) reasons.push('net credit to homeowner');

  res.json({
    summary: {
      baseline_budget: bb,
      baseline_days: bd,
      total_cost_delta,
      total_days_delta,
      new_budget,
      new_days,
      recommended_contingency,
      recommendation,
      reasons,
    },
    items,
    generated_at: new Date().toISOString(),
  });
});

module.exports = router;
