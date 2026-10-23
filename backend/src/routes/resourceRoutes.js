const express = require('express');
const {
  getResources,
  getResourceById,
  updateResourceStatus,
  getMetrics,
} = require('../controllers/resourceController');
const {
  allocateResource,
  releaseAllocation,
} = require('../controllers/resourceAllocationController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Metrics endpoint (before :id)
router.get('/resources/metrics', getMetrics);

// Resource inventory endpoints
router.get('/resources', getResources);
router.get('/resources/:id', getResourceById);
router.patch('/resources/:id/status', authorize('commander', 'admin'), updateResourceStatus);

// Resource allocation & release endpoints
router.post('/incidents/:id/allocate-resource', authorize('commander', 'admin'), allocateResource);
router.post('/resource-allocations/:id/release', authorize('commander', 'admin'), releaseAllocation);

module.exports = router;
