const dashboardRepository = require('../db/dashboardRepository');

async function getDashboardMetrics() {
  return await dashboardRepository.getMetrics();
}

module.exports = {
  getDashboardMetrics,
};
