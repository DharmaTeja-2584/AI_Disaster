const express = require('express');
const {
  getShelters,
  getShelterById,
  getMetrics,
} = require('../controllers/shelterController');
const {
  getCandidates,
  assignShelter,
  releaseAssignment,
} = require('../controllers/shelterAssignmentController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Shelter metrics (must be defined before /:id)
router.get('/shelters/metrics', getMetrics);

// Shelter list & details (accessible to all authenticated roles)
router.get('/shelters', getShelters);
router.get('/shelters/:id', getShelterById);

// Incident shelter routing & assignment (commander/admin only)
router.get('/incidents/:id/candidate-shelters', authorize('commander', 'admin'), getCandidates);
router.post('/incidents/:id/assign-shelter', authorize('commander', 'admin'), assignShelter);
router.post('/shelter-assignments/:id/release', authorize('commander', 'admin'), releaseAssignment);

module.exports = router;
