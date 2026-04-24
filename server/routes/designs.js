const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM designs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM designs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Design not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { room_type, style, description, color_palette, materials, dimensions, estimated_cost, status, designer_name, inspiration_url, notes } = req.body;
    const result = await db.query(
      `INSERT INTO designs (room_type, style, description, color_palette, materials, dimensions, estimated_cost, status, designer_name, inspiration_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [room_type, style, description, color_palette, materials, dimensions, estimated_cost, status || 'concept', designer_name, inspiration_url, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { room_type, style, description, color_palette, materials, dimensions, estimated_cost, status, designer_name, inspiration_url, notes } = req.body;
    const result = await db.query(
      `UPDATE designs SET room_type=$1, style=$2, description=$3, color_palette=$4, materials=$5, dimensions=$6, estimated_cost=$7, status=$8, designer_name=$9, inspiration_url=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [room_type, style, description, color_palette, materials, dimensions, estimated_cost, status, designer_name, inspiration_url, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Design not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM designs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Design not found' });
    res.json({ message: 'Design deleted', design: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Design visualization and suggestions
router.post('/ai/visualize', auth, async (req, res) => {
  try {
    const { room_type, style, dimensions, budget, preferences } = req.body;
    const prompt = `Create a detailed design visualization description for:

Room: ${room_type}
Style: ${style}
Dimensions: ${dimensions}
Budget: $${budget}
Preferences: ${preferences}

Provide:
1. Detailed room layout description
2. Color scheme (primary, secondary, accent colors with hex codes)
3. Recommended materials with estimated costs
4. Furniture/fixture suggestions
5. Lighting plan
6. Flooring recommendation
7. Wall treatments
8. Decorative accents
9. Total estimated cost breakdown
10. 3D visualization description (as if describing to a renderer)`;

    const aiResult = await queryAI(prompt, 'You are an expert interior designer specializing in home renovations. Provide vivid, detailed design descriptions.');
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Style recommendation
router.post('/ai/recommend', auth, async (req, res) => {
  try {
    const designs = await db.query('SELECT * FROM designs');
    const { preferences, budget } = req.body;

    const prompt = `Based on the existing designs in this renovation project and the homeowner's preferences, recommend cohesive design elements:

Existing Designs:
${designs.rows.map(d => `- ${d.room_type}: ${d.style} style, ${d.color_palette}, Materials: ${d.materials}`).join('\n')}

Homeowner Preferences: ${preferences}
Total Budget: $${budget}

Provide:
1. Cohesive style recommendation
2. Material consistency suggestions
3. Color flow between rooms
4. Cost-effective alternatives
5. Trend analysis
6. Long-term value considerations`;

    const aiResult = await queryAI(prompt, 'You are an expert interior designer who creates cohesive whole-home design plans.');
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
