const shelterService = require('../services/shelterService');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getShelters = asyncHandler(async (req, res) => {
  const result = await shelterService.getShelters(req.query);
  return sendSuccess(res, result, 'Shelters retrieved successfully', 200);
});

const getShelterById = asyncHandler(async (req, res) => {
  const shelter = await shelterService.getShelterById(req.params.id);
  return sendSuccess(res, { shelter }, 'Shelter details retrieved', 200);
});

const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await shelterService.getShelterMetrics();
  return sendSuccess(res, { metrics }, 'Shelter metrics retrieved successfully', 200);
});

module.exports = {
  getShelters,
  getShelterById,
  getMetrics,
};
