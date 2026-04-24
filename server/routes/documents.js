const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, document_type, category, file_name, uploaded_by, description, tags, version, status, notes } = req.body;
    const result = await db.query(
      `INSERT INTO documents (title, document_type, category, file_name, uploaded_by, description, tags, version, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, document_type, category, file_name, uploaded_by, description, tags, version || '1.0', status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, document_type, category, file_name, uploaded_by, description, tags, version, status, notes } = req.body;
    const result = await db.query(
      `UPDATE documents SET title=$1, document_type=$2, category=$3, file_name=$4, uploaded_by=$5, description=$6, tags=$7, version=$8, status=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, document_type, category, file_name, uploaded_by, description, tags, version, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM documents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/organize', auth, async (req, res) => {
  try {
    const docs = await db.query('SELECT * FROM documents');
    const prompt = `Analyze this renovation project document library and suggest improvements:\n\n${docs.rows.map(d => `- ${d.title} (${d.document_type}, ${d.category}): v${d.version}, by ${d.uploaded_by}, Status: ${d.status}`).join('\n')}\n\nProvide:\n1. Missing critical documents\n2. Organization improvements\n3. Version control recommendations\n4. Compliance document checklist\n5. Document retention policy\n6. Sharing and access recommendations`;
    const aiResult = await queryAI(prompt, 'You are a construction document management specialist.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
