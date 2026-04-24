const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all photos
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos ORDER BY taken_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photos by room
router.get('/room/:room', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos WHERE room = $1 ORDER BY taken_date DESC', [req.params.room]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photos by phase
router.get('/phase/:phase', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos WHERE phase = $1 ORDER BY taken_date DESC', [req.params.phase]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photo by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM photos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create photo
router.post('/', auth, async (req, res) => {
  try {
    const { title, room, phase, description, photo_url, taken_date, tags, notes } = req.body;
    const result = await db.query(
      `INSERT INTO photos (title, room, phase, description, photo_url, taken_date, tags, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, room, phase || 'before', description, photo_url, taken_date, tags, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update photo
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, room, phase, description, photo_url, taken_date, tags, notes } = req.body;
    const result = await db.query(
      `UPDATE photos SET title=$1, room=$2, phase=$3, description=$4, photo_url=$5, taken_date=$6, tags=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, room, phase, description, photo_url, taken_date, tags, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete photo
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM photos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.json({ message: 'Photo deleted', photo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
