const resourceService = require('../services/resourceService');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getResources = asyncHandler(async (req, res) => {
  const result = await resourceService.getResources(req.query);
  return sendSuccess(res, result, 'Resources retrieved successfully', 200);
});

const getResourceById = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  return sendSuccess(res, { resource }, 'Resource details retrieved', 200);
});

const updateResourceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await resourceService.updateResourceStatus(req.params.id, status);
  return sendSuccess(res, { resource: updated }, `Resource status updated to ${status}`, 200);
});

const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await resourceService.getResourceMetrics();
  return sendSuccess(res, { metrics }, 'Resource metrics retrieved successfully', 200);
});

module.exports = {
  getResources,
  getResourceById,
  updateResourceStatus,
  getMetrics,
};
