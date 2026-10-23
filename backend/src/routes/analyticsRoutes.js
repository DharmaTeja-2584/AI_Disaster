const express = require('express');
const {
  getOverview,
  getIncidentAnalytics,
  getResourceAnalytics,
  getTeamAnalytics,
  getShelterAnalytics,
  getAiAnalytics,
  getRiskHotspots,
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Commander and Admin have full access; Responders can view operational overview/hotspots
router.get('/analytics/overview', authorize('commander', 'admin', 'responder'), getOverview);
router.get('/analytics/incidents', authorize('commander', 'admin', 'responder'), getIncidentAnalytics);
router.get('/analytics/resources', authorize('commander', 'admin'), getResourceAnalytics);
router.get('/analytics/teams', authorize('commander', 'admin'), getTeamAnalytics);
router.get('/analytics/shelters', authorize('commander', 'admin'), getShelterAnalytics);
router.get('/analytics/ai', authorize('commander', 'admin'), getAiAnalytics);
router.get('/analytics/hotspots', authorize('commander', 'admin', 'responder'), getRiskHotspots);

module.exports = router;
