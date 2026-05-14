const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

function persistAIResult(userId, route, entityId, result) {
  db.query(
    'INSERT INTO ai_analyses (user_id, route, entity_id, result) VALUES ($1,$2,$3,$4)',
    [userId, route, entityId, typeof result === 'string' ? result : JSON.stringify(result)]
  ).catch(() => {});
}

// Get all contractors
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      db.query('SELECT * FROM contractors ORDER BY rating DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM contractors'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
    if (!name) {
      return res.status(400).json({ error: 'name is required.' });
    }
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

// AI: Compare bids between multiple contractors
router.post('/compare-bids', auth, async (req, res) => {
  try {
    const { contractor_ids } = req.body;
    if (!Array.isArray(contractor_ids) || contractor_ids.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 contractor_ids.' });
    }
    if (contractor_ids.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 contractors can be compared at once.' });
    }

    const placeholders = contractor_ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await db.query(
      `SELECT * FROM contractors WHERE id IN (${placeholders})`,
      contractor_ids
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No contractors found for given IDs.' });
    }

    const contractorList = result.rows.map(c =>
      `ID ${c.id} - ${c.name}: Specialty: ${c.specialty}, Rate: $${c.hourly_rate}/hr, Experience: ${c.years_experience} yrs, Rating: ${c.rating}/5, Insurance: ${c.insurance_verified ? 'Yes' : 'No'}, Location: ${c.location}, Status: ${c.availability_status}`
    ).join('\n');

    const prompt = `Compare these contractor bids:

${contractorList}

Return a JSON object with these exact fields:
{
  "recommendation": string,
  "price_analysis": string,
  "scope_gaps": string[],
  "winner_id": number,
  "negotiation_tips": string[]
}`;

    const aiResult = await queryAI(prompt, 'You are an expert home renovation consultant specializing in contractor bid analysis. Always return valid JSON.');
    persistAIResult(req.user?.id, 'contractors/compare-bids', null, aiResult.content);

    let structured = null;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) structured = JSON.parse(jsonMatch[0]);
    } catch (_) {}

    res.json({ contractors: result.rows, ai_analysis: aiResult, structured });
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
    persistAIResult(req.user?.id, 'contractors/ai/match', null, aiResult.content);
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
    persistAIResult(req.user?.id, 'contractors/ai/vet', c.id, aiResult.content);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent AI analyses for contractors
router.get('/ai/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM ai_analyses WHERE route LIKE 'contractors%' ORDER BY created_at DESC LIMIT 3"
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
