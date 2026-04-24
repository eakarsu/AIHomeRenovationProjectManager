const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM materials ORDER BY category, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM materials WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, supplier, quantity, unit, unit_price, total_cost, status, delivery_date, room, notes } = req.body;
    const result = await db.query(
      `INSERT INTO materials (name, category, supplier, quantity, unit, unit_price, total_cost, status, delivery_date, room, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, category, supplier, quantity, unit, unit_price, total_cost, status || 'needed', delivery_date, room, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, supplier, quantity, unit, unit_price, total_cost, status, delivery_date, room, notes } = req.body;
    const result = await db.query(
      `UPDATE materials SET name=$1, category=$2, supplier=$3, quantity=$4, unit=$5, unit_price=$6, total_cost=$7, status=$8, delivery_date=$9, room=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, category, supplier, quantity, unit, unit_price, total_cost, status, delivery_date, room, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM materials WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/optimize', auth, async (req, res) => {
  try {
    const materials = await db.query('SELECT * FROM materials ORDER BY category');
    const prompt = `Analyze these renovation materials and suggest optimizations:\n\n${materials.rows.map(m => `- ${m.name} (${m.category}): ${m.quantity} ${m.unit} @ $${m.unit_price}/${m.unit}, Supplier: ${m.supplier}, Status: ${m.status}, Room: ${m.room}`).join('\n')}\n\nProvide:\n1. Cost-saving alternatives\n2. Bulk purchase opportunities\n3. Quality vs. cost analysis\n4. Delivery scheduling optimization\n5. Sustainability recommendations\n6. Potential supply chain risks`;
    const aiResult = await queryAI(prompt, 'You are a construction materials procurement specialist.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
