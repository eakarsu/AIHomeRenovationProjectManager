const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

// Ensure ai_analyses table exists
db.query(`CREATE TABLE IF NOT EXISTS ai_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  route TEXT,
  entity_id INTEGER,
  result TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

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
      db.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM projects'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, address, project_type, total_budget, start_date, end_date, status, description, client_name, client_phone, notes } = req.body;
    if (!name || !project_type || !total_budget) {
      return res.status(400).json({ error: 'name, project_type, and budget are required.' });
    }
    const result = await db.query(
      `INSERT INTO projects (name, address, project_type, total_budget, start_date, end_date, status, description, client_name, client_phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, address, project_type, total_budget, start_date, end_date, status || 'planning', description, client_name, client_phone, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, address, project_type, total_budget, start_date, end_date, status, description, client_name, client_phone, notes } = req.body;
    const result = await db.query(
      `UPDATE projects SET name=$1, address=$2, project_type=$3, total_budget=$4, start_date=$5, end_date=$6, status=$7, description=$8, client_name=$9, client_phone=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, address, project_type, total_budget, start_date, end_date, status, description, client_name, client_phone, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const projects = await db.query('SELECT * FROM projects');
    const prompt = `Analyze these renovation projects and provide strategic insights:\n\n${projects.rows.map(p => `- ${p.name}: ${p.project_type}, Budget: $${p.total_budget}, Status: ${p.status}, ${p.address}`).join('\n')}\n\nProvide:\n1. Portfolio health score (1-100)\n2. Risk assessment per project\n3. Resource allocation recommendations\n4. Timeline optimization suggestions\n5. Budget efficiency analysis\n6. Priority ranking`;
    const aiResult = await queryAI(prompt, 'You are a renovation project portfolio manager.');
    persistAIResult(req.user?.id, 'projects/ai/analyze', null, aiResult.content);
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get recent AI analyses for a route
router.get('/ai/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM ai_analyses WHERE route LIKE 'projects%' ORDER BY created_at DESC LIMIT 3"
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
