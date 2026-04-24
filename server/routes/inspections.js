const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inspections ORDER BY scheduled_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { inspection_type, inspector_name, inspector_phone, scheduled_date, completed_date, status, result, area, permit_ref, follow_up_required, notes } = req.body;
    const r = await db.query(
      `INSERT INTO inspections (inspection_type, inspector_name, inspector_phone, scheduled_date, completed_date, status, result, area, permit_ref, follow_up_required, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [inspection_type, inspector_name, inspector_phone, scheduled_date, completed_date, status || 'scheduled', result, area, permit_ref, follow_up_required || false, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { inspection_type, inspector_name, inspector_phone, scheduled_date, completed_date, status, result, area, permit_ref, follow_up_required, notes } = req.body;
    const r = await db.query(
      `UPDATE inspections SET inspection_type=$1, inspector_name=$2, inspector_phone=$3, scheduled_date=$4, completed_date=$5, status=$6, result=$7, area=$8, permit_ref=$9, follow_up_required=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [inspection_type, inspector_name, inspector_phone, scheduled_date, completed_date, status, result, area, permit_ref, follow_up_required, notes, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM inspections WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/prepare', auth, async (req, res) => {
  try {
    const inspections = await db.query('SELECT * FROM inspections ORDER BY scheduled_date');
    const { inspection_type, area } = req.body;
    const prompt = `Help prepare for this upcoming inspection:\n\nType: ${inspection_type || 'General'}\nArea: ${area || 'Whole house'}\n\nPrevious inspections:\n${inspections.rows.map(i => `- ${i.inspection_type} (${i.area}): ${i.status} - ${i.result || 'pending'} on ${i.scheduled_date}`).join('\n')}\n\nProvide:\n1. Pre-inspection checklist\n2. Common fail points for this type\n3. Code requirements to verify\n4. Documentation to have ready\n5. Areas inspectors focus on most\n6. Tips for passing first time`;
    const aiResult = await queryAI(prompt, 'You are a building inspection preparation specialist.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
