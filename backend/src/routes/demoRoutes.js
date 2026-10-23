const express = require('express');
const {
  getDemoStatus,
  loadBuildingCollapseScenario,
  resetDemoBaseline,
} = require('../controllers/demoController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Demo status is viewable by Commander and Admin
router.get('/demo/status', authorize('commander', 'admin'), getDemoStatus);

// Loading scenario and resetting demo state can be executed by Commander or Admin
router.post('/demo/load-scenario', authorize('commander', 'admin'), loadBuildingCollapseScenario);
router.post('/demo/reset', authorize('commander', 'admin'), resetDemoBaseline);

module.exports = router;
