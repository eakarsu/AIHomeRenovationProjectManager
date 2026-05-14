const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

function persistAIResult(userId, route, entityId, result) {
  db.query(
    'INSERT INTO ai_analyses (user_id, route, entity_id, result) VALUES ($1,$2,$3,$4)',
    [userId, route, entityId, typeof result === 'string' ? result : JSON.stringify(result)]
  ).catch(() => {});
}

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      db.query('SELECT * FROM permits ORDER BY submission_date DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM permits'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { permit_type, description, jurisdiction, status, submission_date, approval_date, expiration_date, fee, inspector_name, inspector_phone, project_address, notes } = req.body;
    const result = await db.query(
      `INSERT INTO permits (permit_type, description, jurisdiction, status, submission_date, approval_date, expiration_date, fee, inspector_name, inspector_phone, project_address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [permit_type, description, jurisdiction, status || 'pending', submission_date, approval_date, expiration_date, fee, inspector_name, inspector_phone, project_address, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { permit_type, description, jurisdiction, status, submission_date, approval_date, expiration_date, fee, inspector_name, inspector_phone, project_address, notes } = req.body;
    const result = await db.query(
      `UPDATE permits SET permit_type=$1, description=$2, jurisdiction=$3, status=$4, submission_date=$5, approval_date=$6, expiration_date=$7, fee=$8, inspector_name=$9, inspector_phone=$10, project_address=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [permit_type, description, jurisdiction, status, submission_date, approval_date, expiration_date, fee, inspector_name, inspector_phone, project_address, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM permits WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permit not found' });
    res.json({ message: 'Permit deleted', permit: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/requirements', auth, async (req, res) => {
  try {
    const { project_type, location, scope } = req.body;
    const prompt = `As a building permit specialist, advise on permit requirements for:

Project Type: ${project_type}
Location: ${location}
Scope: ${scope}

Provide:
1. Required permits (list each with estimated fees)
2. Typical approval timeline
3. Common documentation needed
4. Potential issues or delays
5. Tips for faster approval
6. Inspection stages required`;

    const aiResult = await queryAI(prompt, 'You are a building permit and code compliance expert.');
    persistAIResult(req.user?.id, 'permits/ai/requirements', null, aiResult.content);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
