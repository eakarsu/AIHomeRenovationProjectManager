const express = require('express');

const router = express.Router();

function readiness(input = {}) {
  const inspections = input.inspections || [
    { trade: 'electrical rough-in', photos_uploaded: true, permit_posted: true, open_punch_items: 1, contractor_confirmed: true },
    { trade: 'plumbing', photos_uploaded: false, permit_posted: true, open_punch_items: 4, contractor_confirmed: false },
  ];
  return {
    inspections: inspections.map((i) => {
      const score = (i.photos_uploaded ? 25 : 0) + (i.permit_posted ? 25 : 0) + (i.contractor_confirmed ? 25 : 0) + Math.max(0, 25 - Number(i.open_punch_items) * 6);
      return { ...i, readiness_score: score, status: score >= 80 ? 'ready_to_schedule' : score >= 55 ? 'needs_closeout' : 'not_ready' };
    }),
  };
}

router.get('/', (req, res) => res.json(readiness()));
router.post('/check', (req, res) => res.json(readiness(req.body || {})));

module.exports = router;
