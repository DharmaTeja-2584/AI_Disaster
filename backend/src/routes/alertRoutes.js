const express = require('express');
const {
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  getIncidentAlerts,
  createIncidentAlert,
} = require('../controllers/alertController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// List all alerts (civilian sees public alerts, responder sees tactical alerts, commander/admin see all)
router.get('/alerts', getAlerts);

// Create operational alert (commander, admin)
router.post('/alerts', authorize('commander', 'admin'), createAlert);

// Get alert details
router.get('/alerts/:id', getAlertById);

// Acknowledge alert (responder only)
router.patch('/alerts/:id/acknowledge', authorize('responder'), acknowledgeAlert);

// Incident-specific alerts
router.get('/incidents/:id/alerts', getIncidentAlerts);
router.post('/incidents/:id/alerts', authorize('commander', 'admin'), createIncidentAlert);

module.exports = router;
