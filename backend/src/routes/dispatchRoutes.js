const express = require('express');
const { getCandidates, allocateTeam } = require('../controllers/dispatchController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Dispatch routes for incidents
router.get('/incidents/:id/candidate-teams', authorize('commander', 'admin'), getCandidates);
router.post('/incidents/:id/allocate-team', authorize('commander', 'admin'), allocateTeam);

module.exports = router;
