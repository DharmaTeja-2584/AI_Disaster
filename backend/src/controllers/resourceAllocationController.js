const resourceService = require('../services/resourceService');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const allocateResource = asyncHandler(async (req, res) => {
  const { resourceId, quantity } = req.body;
  const result = await resourceService.allocateResource(req.params.id, {
    resourceId: Number(resourceId),
    quantity: Number(quantity),
  });
  return sendSuccess(res, result, 'Resource allocated successfully', 200);
});

const releaseAllocation = asyncHandler(async (req, res) => {
  const result = await resourceService.releaseResourceAllocation(req.params.id);
  return sendSuccess(res, result, 'Resource allocation released successfully', 200);
});

module.exports = {
  allocateResource,
  releaseAllocation,
};
