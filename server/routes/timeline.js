const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM timeline_tasks ORDER BY start_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM timeline_tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { task_name, phase, description, start_date, end_date, assigned_contractor, status, dependencies, priority, completion_percentage, notes } = req.body;
    const result = await db.query(
      `INSERT INTO timeline_tasks (task_name, phase, description, start_date, end_date, assigned_contractor, status, dependencies, priority, completion_percentage, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [task_name, phase, description, start_date, end_date, assigned_contractor, status || 'not_started', dependencies, priority || 'medium', completion_percentage || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { task_name, phase, description, start_date, end_date, assigned_contractor, status, dependencies, priority, completion_percentage, notes } = req.body;
    const result = await db.query(
      `UPDATE timeline_tasks SET task_name=$1, phase=$2, description=$3, start_date=$4, end_date=$5, assigned_contractor=$6, status=$7, dependencies=$8, priority=$9, completion_percentage=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [task_name, phase, description, start_date, end_date, assigned_contractor, status, dependencies, priority, completion_percentage, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM timeline_tasks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted', task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Optimize timeline
router.post('/ai/optimize', auth, async (req, res) => {
  try {
    const tasks = await db.query('SELECT * FROM timeline_tasks ORDER BY start_date');
    const contractors = await db.query('SELECT name, specialty, availability_status FROM contractors');

    const prompt = `Optimize this renovation project timeline:

Current Tasks:
${tasks.rows.map(t => `- ${t.task_name} (${t.phase}): ${t.start_date} to ${t.end_date}, Status: ${t.status}, ${t.completion_percentage}% done, Priority: ${t.priority}, Dependencies: ${t.dependencies || 'none'}, Assigned: ${t.assigned_contractor || 'unassigned'}`).join('\n')}

Available Contractors:
${contractors.rows.map(c => `- ${c.name}: ${c.specialty} (${c.availability_status})`).join('\n')}

Provide:
1. Optimized schedule with parallel tasks where possible
2. Critical path analysis
3. Bottleneck identification
4. Risk areas and buffer recommendations
5. Contractor assignment suggestions
6. Estimated completion date
7. Weather/seasonal considerations`;

    const aiResult = await queryAI(prompt, 'You are a construction project manager expert specializing in residential renovation scheduling and timeline optimization.');
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Schedule conflict detection
router.post('/ai/conflicts', auth, async (req, res) => {
  try {
    const tasks = await db.query('SELECT * FROM timeline_tasks ORDER BY start_date');

    const prompt = `Analyze this renovation timeline for conflicts, dependencies, and scheduling issues:

Tasks:
${tasks.rows.map(t => `- ${t.task_name} (${t.phase}): ${t.start_date} to ${t.end_date}, Status: ${t.status}, Dependencies: ${t.dependencies || 'none'}, Contractor: ${t.assigned_contractor || 'unassigned'}`).join('\n')}

Identify:
1. Schedule conflicts (overlapping tasks that can't coexist)
2. Dependency violations
3. Resource conflicts (same contractor, same time)
4. Unrealistic timelines
5. Missing prerequisites
6. Recommendations to resolve each issue`;

    const aiResult = await queryAI(prompt, 'You are a construction scheduling expert who identifies and resolves timeline conflicts.');
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
