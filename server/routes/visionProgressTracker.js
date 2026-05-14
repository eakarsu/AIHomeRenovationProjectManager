// Vision-based construction progress tracking from daily photo uploads.
// Audit: batch_04.md / AIHomeRenovationProjectManager / Custom Feature Suggestions #2
const express = require('express');
const auth = require('../middleware/auth');
const { queryAIVision } = require('../services/openrouter');
const pool = require('../db');

const router = express.Router();
router.use(auth);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/vision-progress/analyze
// Body: { project_id, image_urls: [..], expected_milestone? }
router.post('/analyze', async (req, res) => {
  try {
    const { project_id, image_urls = [], expected_milestone } = req.body || {};
    if (!project_id || image_urls.length === 0) {
      return res.status(400).json({ error: 'project_id and image_urls required' });
    }

    let project = null;
    try {
      const r = await pool.query(`SELECT * FROM projects WHERE id = $1`, [project_id]);
      project = r.rows[0] || null;
    } catch (_) {}

    const systemPrompt = `You are a construction-vision progress analyst. From recent photo URLs, infer current
work stage, percent complete, quality issues, and a written progress report. Return STRICT JSON only.`;

    const userPrompt = `Project: ${JSON.stringify(project)}
Expected milestone: ${expected_milestone || 'unspecified'}
Recent photo URLs (${image_urls.length}):
${image_urls.slice(0, 10).join('\n')}

Return JSON:
{
  "summary": "...",
  "current_stage": "demo|framing|electrical|plumbing|drywall|paint|trim|finish|complete",
  "percent_complete_estimate": 0,
  "quality_observations": [{ "issue": "string", "severity": "low|medium|high", "remediation": "string" }],
  "schedule_health": "ahead|on_track|behind",
  "progress_report_paragraph": "string",
  "follow_up_photos_recommended": ["..."],
  "disclaimer": "AI-assisted progress estimate; site inspector verifies."
}`;

    let raw;
    try { raw = await queryAIVision(userPrompt, image_urls, systemPrompt); }
    catch (_) {
      const { queryAI } = require('../services/openrouter');
      const r = await queryAI(userPrompt, systemPrompt);
      raw = r && r.content ? r.content : (typeof r === 'string' ? r : JSON.stringify(r));
    }

    const parsed = parseJSON(typeof raw === 'string' ? raw : (raw?.content || ''));

    try {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS vision_progress_reports (
          id SERIAL PRIMARY KEY, user_id INTEGER, project_id INTEGER,
          payload JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
        )`
      );
      await pool.query(
        `INSERT INTO vision_progress_reports (user_id, project_id, payload) VALUES ($1,$2,$3)`,
        [req.user.id, project_id, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ project_id, image_count: image_urls.length, report: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/project/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, payload, created_at FROM vision_progress_reports
       WHERE project_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [req.params.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
