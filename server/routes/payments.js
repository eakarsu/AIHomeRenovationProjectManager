const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue,
        COUNT(*) as total_payments
      FROM payments
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { payee_name, payment_type, amount, payment_method, payment_date, invoice_number, category, description, status, due_date, notes } = req.body;
    const result = await db.query(
      `INSERT INTO payments (payee_name, payment_type, amount, payment_method, payment_date, invoice_number, category, description, status, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [payee_name, payment_type, amount, payment_method, payment_date, invoice_number, category, description, status || 'pending', due_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { payee_name, payment_type, amount, payment_method, payment_date, invoice_number, category, description, status, due_date, notes } = req.body;
    const result = await db.query(
      `UPDATE payments SET payee_name=$1, payment_type=$2, amount=$3, payment_method=$4, payment_date=$5, invoice_number=$6, category=$7, description=$8, status=$9, due_date=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [payee_name, payment_type, amount, payment_method, payment_date, invoice_number, category, description, status, due_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM payments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
