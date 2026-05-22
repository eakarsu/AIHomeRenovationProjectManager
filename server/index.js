const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_timeline_predictor_based_on_scope = require('./routes/gap-no-timeline-predictor-based-on-scope');
const route_gap_no_budget_optimizer_overspend_flagger = require('./routes/gap-no-budget-optimizer-overspend-flagger');
const route_gap_no_contractor_recommendation_engine = require('./routes/gap-no-contractor-recommendation-engine');
const route_gap_no_material_cost_estimator = require('./routes/gap-no-material-cost-estimator');
const route_gap_no_vision_based_inspection_analyzer = require('./routes/gap-no-vision-based-inspection-analyzer');
const route_gap_no_schedule_conflict_detector_across_tra = require('./routes/gap-no-schedule-conflict-detector-across-tra');
const route_gap_no_lien_management = require('./routes/gap-no-lien-management');
const route_gap_no_formal_change_order_workflow = require('./routes/gap-no-formal-change-order-workflow');
const route_gap_no_contractorsupplier_marketplace = require('./routes/gap-no-contractorsupplier-marketplace');
const route_gap_no_webhook_surface = require('./routes/gap-no-webhook-surface');
const route_gap_no_real_time_homeowner_update_feed = require('./routes/gap-no-real-time-homeowner-update-feed');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(require('helmet')());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '20mb' }));

// AI rate limiter: 20 requests/hour per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contractors', require('./routes/contractors'));
app.use('/api/permits', require('./routes/permits'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/designs', require('./routes/designs'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/punchlist', require('./routes/punchlist'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/warranties', require('./routes/warranties'));
app.use('/api/dailylog', require('./routes/dailylog'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/payments', require('./routes/payments'));
// Apply pass 5 — additive: integration stubs + mechanical performance/change-order
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/vision-progress', require('./routes/visionProgressTracker'));
app.use('/api/change-order', require('./routes/changeOrderAdvisor'));
app.use('/api/permit-inspection-readiness', require('./routes/permitInspectionReadiness'));

// Apply AI rate limiter to all AI sub-routes
const aiRoutes = [
  '/api/budget/ai',
  '/api/permits/ai',
  '/api/designs/ai',
  '/api/projects/ai',
  '/api/contractors/ai',
  '/api/contractors/compare-bids',
  '/api/photos/ai-describe',
  '/api/materials/ai',
  '/api/timeline/ai',
  '/api/inspections/ai',
  '/api/rooms/ai',
];
aiRoutes.forEach((route) => app.use(route, aiRateLimiter));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/gap-no-timeline-predictor-based-on-scope', route_gap_no_timeline_predictor_based_on_scope);
app.use('/api/gap-no-budget-optimizer-overspend-flagger', route_gap_no_budget_optimizer_overspend_flagger);
app.use('/api/gap-no-contractor-recommendation-engine', route_gap_no_contractor_recommendation_engine);
app.use('/api/gap-no-material-cost-estimator', route_gap_no_material_cost_estimator);
app.use('/api/gap-no-vision-based-inspection-analyzer', route_gap_no_vision_based_inspection_analyzer);
app.use('/api/gap-no-schedule-conflict-detector-across-tra', route_gap_no_schedule_conflict_detector_across_tra);
app.use('/api/gap-no-lien-management', route_gap_no_lien_management);
app.use('/api/gap-no-formal-change-order-workflow', route_gap_no_formal_change_order_workflow);
app.use('/api/gap-no-contractorsupplier-marketplace', route_gap_no_contractorsupplier_marketplace);
app.use('/api/gap-no-webhook-surface', route_gap_no_webhook_surface);
app.use('/api/gap-no-real-time-homeowner-update-feed', route_gap_no_real_time_homeowner_update_feed);

app.listen(PORT, () => {
  console.log(`Home Renovation API running on port ${PORT}`);
});
