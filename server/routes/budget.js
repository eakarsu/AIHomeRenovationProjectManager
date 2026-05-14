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

// Budget items
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      db.query('SELECT * FROM budget_items ORDER BY category, created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      db.query('SELECT COUNT(*) FROM budget_items'),
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM budget_items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { category, description, estimated_cost, actual_cost, vendor, status, priority, notes } = req.body;
    const result = await db.query(
      `INSERT INTO budget_items (category, description, estimated_cost, actual_cost, vendor, status, priority, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [category, description, estimated_cost, actual_cost || 0, vendor, status || 'planned', priority || 'medium', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { category, description, estimated_cost, actual_cost, vendor, status, priority, notes } = req.body;
    const result = await db.query(
      `UPDATE budget_items SET category=$1, description=$2, estimated_cost=$3, actual_cost=$4, vendor=$5, status=$6, priority=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [category, description, estimated_cost, actual_cost, vendor, status, priority, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM budget_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget item not found' });
    res.json({ message: 'Budget item deleted', item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Orders
router.get('/change-orders/all', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM change_orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/change-orders/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM change_orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Change order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-orders', auth, async (req, res) => {
  try {
    const { title, description, original_cost, new_cost, reason, impact_timeline, status, requested_by, notes } = req.body;
    const result = await db.query(
      `INSERT INTO change_orders (title, description, original_cost, new_cost, reason, impact_timeline, status, requested_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, description, original_cost, new_cost, reason, impact_timeline, status || 'pending', requested_by, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/change-orders/:id', auth, async (req, res) => {
  try {
    const { title, description, original_cost, new_cost, reason, impact_timeline, status, requested_by, notes } = req.body;
    const result = await db.query(
      `UPDATE change_orders SET title=$1, description=$2, original_cost=$3, new_cost=$4, reason=$5, impact_timeline=$6, status=$7, requested_by=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title, description, original_cost, new_cost, reason, impact_timeline, status, requested_by, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Change order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/change-orders/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM change_orders WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Change order not found' });
    res.json({ message: 'Change order deleted', order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Budget analysis
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const items = await db.query('SELECT * FROM budget_items ORDER BY category');
    const changes = await db.query('SELECT * FROM change_orders');

    const totalEstimated = items.rows.reduce((s, i) => s + parseFloat(i.estimated_cost || 0), 0);
    const totalActual = items.rows.reduce((s, i) => s + parseFloat(i.actual_cost || 0), 0);
    const totalChangeOrders = changes.rows.reduce((s, c) => s + (parseFloat(c.new_cost || 0) - parseFloat(c.original_cost || 0)), 0);

    const prompt = `Analyze this renovation budget:

Total Estimated: $${totalEstimated.toFixed(2)}
Total Actual Spent: $${totalActual.toFixed(2)}
Change Order Impact: $${totalChangeOrders.toFixed(2)}
Variance: $${(totalActual - totalEstimated).toFixed(2)}

Budget Items by Category:
${items.rows.map(i => `- ${i.category}: ${i.description} — Est: $${i.estimated_cost}, Actual: $${i.actual_cost}, Status: ${i.status}`).join('\n')}

Change Orders:
${changes.rows.map(c => `- ${c.title}: $${c.original_cost} → $${c.new_cost} (${c.status}) — ${c.reason}`).join('\n')}

Provide:
1. Budget health score (1-100)
2. Areas of concern (overspending)
3. Cost-saving opportunities
4. Forecast for remaining budget
5. Risk assessment
6. Recommendations`;

    const aiResult = await queryAI(prompt, 'You are a home renovation financial analyst specializing in budget management and cost optimization.');
    persistAIResult(req.user?.id, 'budget/ai/analyze', null, aiResult.content);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Cost-Variance Predictor — warns at item-creation time based on historical overruns
router.post('/ai/variance-predict', auth, async (req, res) => {
  try {
    const { category, description, estimated_cost } = req.body;
    if (!category || !estimated_cost) {
      return res.status(400).json({ error: 'category and estimated_cost are required' });
    }

    // Fetch historical items in same category to compute overrun stats
    const histResult = await db.query(
      `SELECT category, description, estimated_cost, actual_cost,
              CASE WHEN estimated_cost > 0 THEN ((actual_cost - estimated_cost) / estimated_cost * 100) ELSE 0 END as overrun_pct
       FROM budget_items
       WHERE category = $1 AND status = 'completed' AND actual_cost > 0
       ORDER BY updated_at DESC LIMIT 20`,
      [category]
    );

    const allItems = await db.query(
      `SELECT category,
              AVG(CASE WHEN estimated_cost > 0 THEN ((actual_cost - estimated_cost) / estimated_cost * 100) ELSE 0 END) as avg_overrun_pct,
              COUNT(*) as sample_size
       FROM budget_items WHERE status = 'completed' AND actual_cost > 0
       GROUP BY category`
    );

    const catStats = histResult.rows;
    const avgOverrun = catStats.length > 0
      ? (catStats.reduce((s, r) => s + parseFloat(r.overrun_pct || 0), 0) / catStats.length).toFixed(1)
      : null;

    const allCategoryStats = allItems.rows.map(r =>
      `${r.category}: avg overrun ${parseFloat(r.avg_overrun_pct || 0).toFixed(1)}% (n=${r.sample_size})`
    ).join(', ');

    const prompt = `As a home renovation cost analyst, predict variance risk for this new budget item.

NEW ITEM:
- Category: ${category}
- Description: ${description || 'N/A'}
- Estimated Cost: $${estimated_cost}

HISTORICAL DATA FOR "${category}" CATEGORY (${catStats.length} completed items):
${catStats.map(r => `Est: $${r.estimated_cost} → Actual: $${r.actual_cost} (${parseFloat(r.overrun_pct) > 0 ? '+' : ''}${parseFloat(r.overrun_pct).toFixed(0)}% overrun): ${r.description}`).join('\n') || 'No historical data for this category'}

Average overrun for this category: ${avgOverrun !== null ? `${avgOverrun}%` : 'N/A'}

All category averages: ${allCategoryStats || 'No data'}

Return ONLY valid JSON:
{
  "variance_risk": "low"|"medium"|"high",
  "predicted_overrun_percent": number,
  "predicted_actual_cost": number,
  "warning_message": string,
  "historical_context": string,
  "recommendations": string[]
}`;

    const aiResult = await queryAI(prompt, 'You are an expert home renovation cost analyst. Return only valid JSON, no markdown.');
    persistAIResult(req.user?.id, 'budget/ai/variance-predict', null, aiResult.content);

    let structured = null;
    try {
      const match = aiResult.content.match(/\{[\s\S]*\}/);
      if (match) structured = JSON.parse(match[0]);
    } catch (_) {}

    res.json({ ai_analysis: aiResult, structured, historical_items: catStats.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
