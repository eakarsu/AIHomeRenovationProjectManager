const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM daily_logs ORDER BY log_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM daily_logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { log_date, weather, temperature, crew_size, hours_worked, work_performed, issues, materials_used, visitor_log, safety_incidents, notes } = req.body;
    const result = await db.query(
      `INSERT INTO daily_logs (log_date, weather, temperature, crew_size, hours_worked, work_performed, issues, materials_used, visitor_log, safety_incidents, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [log_date, weather, temperature, crew_size, hours_worked, work_performed, issues, materials_used, visitor_log, safety_incidents, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { log_date, weather, temperature, crew_size, hours_worked, work_performed, issues, materials_used, visitor_log, safety_incidents, notes } = req.body;
    const result = await db.query(
      `UPDATE daily_logs SET log_date=$1, weather=$2, temperature=$3, crew_size=$4, hours_worked=$5, work_performed=$6, issues=$7, materials_used=$8, visitor_log=$9, safety_incidents=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [log_date, weather, temperature, crew_size, hours_worked, work_performed, issues, materials_used, visitor_log, safety_incidents, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM daily_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
