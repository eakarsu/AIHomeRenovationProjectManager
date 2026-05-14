const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      db.query('SELECT * FROM warranties ORDER BY expiration_date ASC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM warranties'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM warranties WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { item_name, category, provider, warranty_type, start_date, expiration_date, coverage_details, claim_process, contact_phone, contact_email, cost, status, notes } = req.body;
    const result = await db.query(
      `INSERT INTO warranties (item_name, category, provider, warranty_type, start_date, expiration_date, coverage_details, claim_process, contact_phone, contact_email, cost, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [item_name, category, provider, warranty_type, start_date, expiration_date, coverage_details, claim_process, contact_phone, contact_email, cost, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { item_name, category, provider, warranty_type, start_date, expiration_date, coverage_details, claim_process, contact_phone, contact_email, cost, status, notes } = req.body;
    const result = await db.query(
      `UPDATE warranties SET item_name=$1, category=$2, provider=$3, warranty_type=$4, start_date=$5, expiration_date=$6, coverage_details=$7, claim_process=$8, contact_phone=$9, contact_email=$10, cost=$11, status=$12, notes=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [item_name, category, provider, warranty_type, start_date, expiration_date, coverage_details, claim_process, contact_phone, contact_email, cost, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM warranties WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/review', auth, async (req, res) => {
  try {
    const warranties = await db.query('SELECT * FROM warranties ORDER BY expiration_date');
    const prompt = `Review these renovation warranties and provide guidance:\n\n${warranties.rows.map(w => `- ${w.item_name} (${w.category}): ${w.warranty_type} by ${w.provider}, Expires: ${w.expiration_date}, Coverage: ${w.coverage_details}, Status: ${w.status}`).join('\n')}\n\nProvide:\n1. Warranties expiring soon (next 90 days)\n2. Coverage gap analysis\n3. Extended warranty recommendations\n4. Claim preparation tips\n5. Maintenance requirements to keep warranties valid\n6. Total warranty value assessment`;
    const aiResult = await queryAI(prompt, 'You are a home warranty and product protection specialist.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
