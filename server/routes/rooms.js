const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms ORDER BY floor, name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, floor, room_type, dimensions, square_footage, current_condition, renovation_scope, estimated_cost, status, assigned_contractor, notes } = req.body;
    const result = await db.query(
      `INSERT INTO rooms (name, floor, room_type, dimensions, square_footage, current_condition, renovation_scope, estimated_cost, status, assigned_contractor, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, floor, room_type, dimensions, square_footage, current_condition, renovation_scope, estimated_cost, status || 'not_started', assigned_contractor, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, floor, room_type, dimensions, square_footage, current_condition, renovation_scope, estimated_cost, status, assigned_contractor, notes } = req.body;
    const result = await db.query(
      `UPDATE rooms SET name=$1, floor=$2, room_type=$3, dimensions=$4, square_footage=$5, current_condition=$6, renovation_scope=$7, estimated_cost=$8, status=$9, assigned_contractor=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, floor, room_type, dimensions, square_footage, current_condition, renovation_scope, estimated_cost, status, assigned_contractor, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/plan', auth, async (req, res) => {
  try {
    const rooms = await db.query('SELECT * FROM rooms ORDER BY floor');
    const prompt = `Create a room-by-room renovation plan:\n\n${rooms.rows.map(r => `- ${r.name} (${r.floor}, ${r.room_type}): ${r.dimensions}, ${r.square_footage} sqft, Condition: ${r.current_condition}, Scope: ${r.renovation_scope}, Est: $${r.estimated_cost}, Status: ${r.status}`).join('\n')}\n\nProvide:\n1. Optimal renovation order\n2. Room dependency analysis\n3. Which rooms to do simultaneously\n4. Living arrangement during renovation\n5. Cost per square foot analysis\n6. ROI ranking by room`;
    const aiResult = await queryAI(prompt, 'You are a home renovation planning expert who optimizes room-by-room renovation sequences.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
