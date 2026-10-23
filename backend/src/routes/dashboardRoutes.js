const express = require('express');
const { getMetrics } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// Protected dashboard routes
router.get('/metrics', authenticate, authorize('commander', 'admin', 'responder'), getMetrics);

module.exports = router;
