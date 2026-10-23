const express = require('express');
const { getTeams, getTeamById, updateTeamStatus } = require('../controllers/responseTeamController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.patch('/:id/status', authorize('commander', 'admin'), updateTeamStatus);

module.exports = router;
