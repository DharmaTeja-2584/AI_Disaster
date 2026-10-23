const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getDashboardMetrics();
  return sendSuccess(res, { metrics }, 'Dashboard operational metrics retrieved successfully', 200);
});

module.exports = {
  getMetrics,
};
