const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAIVision } = require('../services/openrouter');
const router = express.Router();

function persistAIResult(userId, route, entityId, result) {
  db.query(
    'INSERT INTO ai_analyses (user_id, route, entity_id, result) VALUES ($1,$2,$3,$4)',
    [userId, route, entityId, typeof result === 'string' ? result : JSON.stringify(result)]
  ).catch(() => {});
}

// AI: Describe photo and auto-create daily log entry
router.post('/ai-describe', auth, async (req, res) => {
  try {
    const { image_base64, mime_type, project_id } = req.body;
    if (!image_base64 || !mime_type) {
      return res.status(400).json({ error: 'image_base64 and mime_type are required.' });
    }

    const aiResult = await queryAIVision(
      image_base64,
      mime_type,
      'You are analyzing a home renovation photo. Return JSON only with no markdown fences.'
    );

    if (!aiResult.success) {
      return res.status(500).json({ error: aiResult.content });
    }

    let structured = null;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) structured = JSON.parse(jsonMatch[0]);
    } catch (_) {}

    // Auto-create daily log entry
    let logEntry = null;
    try {
      const logText = structured
        ? `AI Photo Analysis — Progress: ${structured.progress_assessment}. Safety: ${(structured.safety_issues || []).join(', ') || 'None noted'}. Completion: ${structured.completion_estimate}%. Next steps: ${(structured.recommended_next_steps || []).join(', ')}.`
        : aiResult.content;

      const logResult = await db.query(
        `INSERT INTO daily_logs (log_date, work_performed, notes)
         VALUES (NOW(),$1,$2) RETURNING *`,
        [logText, `Auto-generated from photo AI analysis${project_id ? ` (project_id: ${project_id})` : ''}`]
      );
      if (logResult) logEntry = logResult.rows[0];
    } catch (_) {}

    persistAIResult(req.user?.id, 'photos/ai-describe', project_id || null, aiResult.content);

    res.json({ ai_analysis: aiResult, structured, log_entry: logEntry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all photos
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      db.query('SELECT * FROM photos ORDER BY taken_date DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM photos'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photos by room
router.get('/room/:room', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos WHERE room = $1 ORDER BY taken_date DESC', [req.params.room]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photos by phase
router.get('/phase/:phase', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos WHERE phase = $1 ORDER BY taken_date DESC', [req.params.phase]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photo by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create photo
router.post('/', auth, async (req, res) => {
  try {
    const { title, room, phase, description, photo_url, taken_date, tags, notes } = req.body;
    const result = await db.query(
      `INSERT INTO photos (title, room, phase, description, photo_url, taken_date, tags, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, room, phase || 'before', description, photo_url, taken_date, tags, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update photo
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, room, phase, description, photo_url, taken_date, tags, notes } = req.body;
    const result = await db.query(
      `UPDATE photos SET title=$1, room=$2, phase=$3, description=$4, photo_url=$5, taken_date=$6, tags=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, room, phase, description, photo_url, taken_date, tags, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete photo
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM photos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.json({ message: 'Photo deleted', photo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
