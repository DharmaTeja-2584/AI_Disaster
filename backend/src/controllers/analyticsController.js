const analyticsService = require('../services/analyticsService');
const { sendSuccess } = require('../utils/response');

async function getOverview(req, res, next) {
  try {
    const period = req.query.period || 'all';
    const data = await analyticsService.getOverview(period);
    return sendSuccess(res, data, 'Analytics overview retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getIncidentAnalytics(req, res, next) {
  try {
    const period = req.query.period || 'all';
    const data = await analyticsService.getIncidentAnalytics(period);
    return sendSuccess(res, data, 'Incident analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getResourceAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getResourceAnalytics();
    return sendSuccess(res, data, 'Resource analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getTeamAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getTeamAnalytics();
    return sendSuccess(res, data, 'Response team analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getShelterAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getShelterAnalytics();
    return sendSuccess(res, data, 'Shelter analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getAiAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getAiAnalytics();
    return sendSuccess(res, data, 'AI intelligence analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getRiskHotspots(req, res, next) {
  try {
    const data = await analyticsService.getRiskHotspots();
    return sendSuccess(res, data, 'Incident risk hotspots retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getIncidentAnalytics,
  getResourceAnalytics,
  getTeamAnalytics,
  getShelterAnalytics,
  getAiAnalytics,
  getRiskHotspots,
};
