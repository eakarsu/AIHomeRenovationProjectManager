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
      db.query('SELECT * FROM inspections ORDER BY scheduled_date DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM inspections'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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

// AI: Inspection insight — analyze a completed inspection's result and recommend remediation
router.post('/ai/insight', auth, async (req, res) => {
  try {
    const { inspection_id } = req.body;
    if (!inspection_id) return res.status(400).json({ error: 'inspection_id required' });
    const ins = await db.query('SELECT * FROM inspections WHERE id = $1', [inspection_id]);
    if (ins.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    const inspection = ins.rows[0];

    const recent = await db.query('SELECT inspection_type, area, status, result, scheduled_date FROM inspections WHERE id <> $1 ORDER BY scheduled_date DESC LIMIT 10', [inspection_id]);

    const prompt = `Analyze this completed inspection and recommend remediation actions.

Inspection:
- Type: ${inspection.inspection_type || 'unspecified'}
- Area: ${inspection.area || 'unspecified'}
- Status: ${inspection.status || 'unspecified'}
- Result: ${inspection.result || 'no result recorded'}
- Notes: ${inspection.notes || 'none'}
- Scheduled: ${inspection.scheduled_date || 'unspecified'}

Recent inspections on this project (for context):
${recent.rows.map(i => `- ${i.inspection_type} (${i.area}): ${i.status} - ${i.result || 'pending'} on ${i.scheduled_date}`).join('\n')}

Provide:
1. Severity assessment of any issues (critical / major / minor / advisory)
2. Specific failed code references where applicable
3. Step-by-step remediation plan with responsible trade per step
4. Estimated remediation cost band (low/mid/high)
5. Recommended re-inspection timing
6. Risk if not corrected (safety, occupancy, financing)
7. Documentation to gather for re-inspection`;

    const aiResult = await queryAI(prompt, 'You are a residential building inspection analyst who interprets inspection findings and produces actionable remediation plans.');
    res.json(aiResult);
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
