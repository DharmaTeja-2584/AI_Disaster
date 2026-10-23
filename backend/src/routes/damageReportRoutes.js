const express = require('express');
const {
  createDamageReport,
  getIncidentDamageReports,
  getDamageReportById,
  getDamageReports,
} = require('../controllers/damageReportController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Damage report general endpoints
router.get('/damage-reports', authorize('responder', 'commander', 'admin'), getDamageReports);
router.get('/damage-reports/:id', authorize('responder', 'commander', 'admin'), getDamageReportById);

// Incident-specific damage report endpoints
router.post('/incidents/:id/damage-reports', authorize('responder', 'commander', 'admin'), createDamageReport);
router.get('/incidents/:id/damage-reports', authorize('responder', 'commander', 'admin'), getIncidentDamageReports);

module.exports = router;
