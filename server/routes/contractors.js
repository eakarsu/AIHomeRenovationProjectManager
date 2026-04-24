const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

// Get all contractors
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contractors ORDER BY rating DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get contractor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contractors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contractor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create contractor
router.post('/', auth, async (req, res) => {
  try {
    const { name, specialty, phone, email, license_number, insurance_verified, rating, hourly_rate, years_experience, location, availability_status, portfolio_url, notes } = req.body;
    const result = await db.query(
      `INSERT INTO contractors (name, specialty, phone, email, license_number, insurance_verified, rating, hourly_rate, years_experience, location, availability_status, portfolio_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, specialty, phone, email, license_number, insurance_verified || false, rating || 0, hourly_rate, years_experience, location, availability_status || 'available', portfolio_url, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update contractor
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, specialty, phone, email, license_number, insurance_verified, rating, hourly_rate, years_experience, location, availability_status, portfolio_url, notes } = req.body;
    const result = await db.query(
      `UPDATE contractors SET name=$1, specialty=$2, phone=$3, email=$4, license_number=$5, insurance_verified=$6, rating=$7, hourly_rate=$8, years_experience=$9, location=$10, availability_status=$11, portfolio_url=$12, notes=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [name, specialty, phone, email, license_number, insurance_verified, rating, hourly_rate, years_experience, location, availability_status, portfolio_url, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contractor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete contractor
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM contractors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contractor not found' });
    res.json({ message: 'Contractor deleted', contractor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Match contractor to project
router.post('/ai/match', auth, async (req, res) => {
  try {
    const { project_description, budget, timeline } = req.body;
    const contractors = await db.query('SELECT name, specialty, rating, hourly_rate, years_experience, availability_status, location FROM contractors WHERE availability_status = $1 ORDER BY rating DESC', ['available']);

    const prompt = `As a home renovation expert, analyze these available contractors and recommend the best matches for this project:

Project: ${project_description}
Budget: $${budget}
Timeline: ${timeline}

Available Contractors:
${contractors.rows.map(c => `- ${c.name}: ${c.specialty}, ${c.years_experience} yrs exp, $${c.hourly_rate}/hr, Rating: ${c.rating}/5, Location: ${c.location}`).join('\n')}

Provide your top 3 recommendations with detailed reasoning for each, including compatibility score (1-10), estimated cost, and any concerns.`;

    const aiResult = await queryAI(prompt, 'You are an expert home renovation consultant who helps homeowners find the perfect contractors for their projects.');
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Vet contractor
router.post('/ai/vet/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contractors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contractor not found' });
    const c = result.rows[0];

    const prompt = `Perform a thorough vetting analysis for this contractor:

Name: ${c.name}
Specialty: ${c.specialty}
License: ${c.license_number}
Insurance Verified: ${c.insurance_verified}
Rating: ${c.rating}/5
Hourly Rate: $${c.hourly_rate}
Years Experience: ${c.years_experience}
Location: ${c.location}
Availability: ${c.availability_status}

Provide a comprehensive vetting report including:
1. Overall Trust Score (1-100)
2. Red flags or concerns
3. Strengths
4. Recommended questions to ask
5. Market rate comparison
6. Final recommendation`;

    const aiResult = await queryAI(prompt, 'You are a home renovation contractor vetting specialist.');
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
