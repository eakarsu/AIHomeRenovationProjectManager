const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM communications ORDER BY comm_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM communications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { subject, message, from_name, to_name, comm_type, comm_date, priority, status, related_to, follow_up_date, notes } = req.body;
    const result = await db.query(
      `INSERT INTO communications (subject, message, from_name, to_name, comm_type, comm_date, priority, status, related_to, follow_up_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [subject, message, from_name, to_name, comm_type || 'note', comm_date || new Date().toISOString().split('T')[0], priority || 'normal', status || 'open', related_to, follow_up_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { subject, message, from_name, to_name, comm_type, comm_date, priority, status, related_to, follow_up_date, notes } = req.body;
    const result = await db.query(
      `UPDATE communications SET subject=$1, message=$2, from_name=$3, to_name=$4, comm_type=$5, comm_date=$6, priority=$7, status=$8, related_to=$9, follow_up_date=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [subject, message, from_name, to_name, comm_type, comm_date, priority, status, related_to, follow_up_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM communications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/draft', auth, async (req, res) => {
  try {
    const { recipient, topic, tone, context } = req.body;
    const prompt = `Draft a professional communication for a home renovation project:\n\nTo: ${recipient}\nTopic: ${topic}\nTone: ${tone || 'professional'}\nContext: ${context}\n\nProvide:\n1. Subject line options (3)\n2. Full message draft\n3. Key points to address\n4. Follow-up action items\n5. Alternative phrasing for sensitive points\n6. Recommended send timing`;
    const aiResult = await queryAI(prompt, 'You are a professional communications specialist for home renovation projects.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
