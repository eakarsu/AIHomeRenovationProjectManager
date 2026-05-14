// Change-order AI advisor estimating cost/timeline impact and
// auto-generating COs.
// Audit: batch_04.md / AIHomeRenovationProjectManager / Custom Feature Suggestions #3
const express = require('express');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const pool = require('../db');

const router = express.Router();
router.use(auth);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/change-order/advise
// Body: { project_id, change_description, scope_delta?, urgency? }
router.post('/advise', async (req, res) => {
  try {
    const { project_id, change_description, scope_delta, urgency = 'normal' } = req.body || {};
    if (!project_id || !change_description) {
      return res.status(400).json({ error: 'project_id and change_description required' });
    }

    let project = null, budget = { rows: [] }, timeline = { rows: [] };
    try {
      const r = await pool.query(`SELECT * FROM projects WHERE id = $1`, [project_id]);
      project = r.rows[0] || null;
    } catch (_) {}
    try { budget = await pool.query(`SELECT * FROM budget WHERE project_id = $1`, [project_id]); } catch (_) {}
    try { timeline = await pool.query(`SELECT * FROM timeline WHERE project_id = $1 ORDER BY scheduled_date ASC LIMIT 30`, [project_id]); } catch (_) {}

    const prompt = `You are a construction change-order advisor. Estimate cost and timeline impact for the
proposed change and draft a formal CO document. Return STRICT JSON only.

Project: ${JSON.stringify(project)}
Change description: ${change_description}
Scope delta: ${scope_delta || 'unspecified'}
Urgency: ${urgency}
Budget snapshot: ${JSON.stringify(budget.rows)}
Timeline snapshot: ${JSON.stringify(timeline.rows.slice(0, 10))}

Return JSON:
{
  "summary": "...",
  "cost_impact_usd": 0,
  "cost_impact_pct": 0,
  "timeline_impact_days": 0,
  "downstream_tasks_affected": ["..."],
  "risk_assessment": "low|medium|high",
  "co_document": {
    "title": "string",
    "scope_change": "string",
    "cost_breakdown": [{ "item": "string", "qty": 0, "unit_cost_usd": 0, "total_usd": 0 }],
    "total_co_usd": 0,
    "revised_completion_date": "YYYY-MM-DD",
    "homeowner_approval_required": true
  },
  "negotiation_anchors": ["..."],
  "disclaimer": "Estimates only; finalize with GC + homeowner."
}`;

    const aiResp = await queryAI(prompt);
    const raw = typeof aiResp === 'string' ? aiResp : (aiResp?.content || '');
    const parsed = parseJSON(raw);

    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS change_orders (
        id SERIAL PRIMARY KEY, user_id INTEGER, project_id INTEGER, description TEXT,
        payload JSONB, status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await pool.query(
        `INSERT INTO change_orders (user_id, project_id, description, payload) VALUES ($1,$2,$3,$4)`,
        [req.user.id, project_id, change_description, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ project_id, advice: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/project/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, description, status, payload, created_at FROM change_orders
       WHERE project_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
