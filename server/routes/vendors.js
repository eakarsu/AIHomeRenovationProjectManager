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
      db.query('SELECT * FROM vendors ORDER BY rating DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM vendors'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, contact_name, phone, email, website, rating, payment_terms, delivery_speed, location, notes } = req.body;
    const result = await db.query(
      `INSERT INTO vendors (name, category, contact_name, phone, email, website, rating, payment_terms, delivery_speed, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, category, contact_name, phone, email, website, rating || 0, payment_terms, delivery_speed, location, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, contact_name, phone, email, website, rating, payment_terms, delivery_speed, location, notes } = req.body;
    const result = await db.query(
      `UPDATE vendors SET name=$1, category=$2, contact_name=$3, phone=$4, email=$5, website=$6, rating=$7, payment_terms=$8, delivery_speed=$9, location=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, category, contact_name, phone, email, website, rating, payment_terms, delivery_speed, location, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM vendors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/compare', auth, async (req, res) => {
  try {
    const vendors = await db.query('SELECT * FROM vendors');
    const { material_needed, budget } = req.body;
    const prompt = `Compare these vendors for a material purchase:\n\nNeed: ${material_needed}\nBudget: $${budget}\n\nVendors:\n${vendors.rows.map(v => `- ${v.name} (${v.category}): Rating ${v.rating}/5, Payment: ${v.payment_terms}, Delivery: ${v.delivery_speed}, Location: ${v.location}`).join('\n')}\n\nProvide:\n1. Best vendor match with reasoning\n2. Price-quality comparison\n3. Delivery reliability assessment\n4. Negotiation tips\n5. Alternative sourcing options\n6. Bulk discount potential`;
    const aiResult = await queryAI(prompt, 'You are a construction procurement and vendor management expert.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
