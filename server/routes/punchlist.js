const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM punchlist ORDER BY priority DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM punchlist WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, room, category, assigned_to, priority, status, due_date, reported_by, notes } = req.body;
    const result = await db.query(
      `INSERT INTO punchlist (title, description, room, category, assigned_to, priority, status, due_date, reported_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description, room, category, assigned_to, priority || 'medium', status || 'open', due_date, reported_by, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, room, category, assigned_to, priority, status, due_date, reported_by, notes } = req.body;
    const result = await db.query(
      `UPDATE punchlist SET title=$1, description=$2, room=$3, category=$4, assigned_to=$5, priority=$6, status=$7, due_date=$8, reported_by=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, description, room, category, assigned_to, priority, status, due_date, reported_by, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM punchlist WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/prioritize', auth, async (req, res) => {
  try {
    const items = await db.query('SELECT * FROM punchlist WHERE status != $1', ['completed']);
    const prompt = `Prioritize and organize this renovation punch list:\n\n${items.rows.map(i => `- ${i.title} (${i.room}, ${i.category}): Priority: ${i.priority}, Assigned: ${i.assigned_to}, Due: ${i.due_date}, Status: ${i.status}`).join('\n')}\n\nProvide:\n1. Recommended completion order\n2. Items that can be done simultaneously\n3. Critical items that block other work\n4. Estimated time per item\n5. Items that need specialist attention\n6. Quality check recommendations`;
    const aiResult = await queryAI(prompt, 'You are a construction quality assurance and punch list management expert.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
