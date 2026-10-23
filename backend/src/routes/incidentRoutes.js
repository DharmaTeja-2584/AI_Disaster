const express = require('express');
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
} = require('../controllers/incidentController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// All incident routes require authentication
router.use(authenticate);

// Create incident (Civilian, Responder, Commander, Admin)
router.post('/', createIncident);

// List incidents
router.get('/', getIncidents);

// Get incident details
router.get('/:id', getIncidentById);

// Update status (Responder, Commander, Admin)
router.patch('/:id/status', authorize('responder', 'commander', 'admin'), updateIncidentStatus);

module.exports = router;
