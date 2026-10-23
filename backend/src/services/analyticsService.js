const analyticsRepository = require('../db/analyticsRepository');
const { generateInsights } = require('./aiInsightsService');

/**
 * Analytics Service
 * Aggregates intelligence across all emergency operations domains.
 */

async function getOverview(period = 'all') {
  const [incidents, resources, teams, shelters, alerts, damage, ai] =
    await Promise.all([
      analyticsRepository.getIncidentAnalytics(period),
      analyticsRepository.getResourceAnalytics(),
      analyticsRepository.getTeamAnalytics(),
      analyticsRepository.getShelterAnalytics(),
      analyticsRepository.getAlertAnalytics(),
      analyticsRepository.getDamageAnalytics(),
      analyticsRepository.getAiAnalytics(),
    ]);

  const insights = generateInsights({
    incidents,
    resources,
    teams,
    shelters,
    alerts,
    damage,
    ai,
  });

  return {
    period,
    incidents,
    resources,
    teams,
    shelters,
    alerts,
    damage,
    ai,
    insights,
  };
}

async function getIncidentAnalytics(period = 'all') {
  return await analyticsRepository.getIncidentAnalytics(period);
}

async function getResourceAnalytics() {
  return await analyticsRepository.getResourceAnalytics();
}

async function getTeamAnalytics() {
  return await analyticsRepository.getTeamAnalytics();
}

async function getShelterAnalytics() {
  return await analyticsRepository.getShelterAnalytics();
}

async function getAiAnalytics() {
  const [ai, incidents, resources, teams, shelters, alerts, damage] =
    await Promise.all([
      analyticsRepository.getAiAnalytics(),
      analyticsRepository.getIncidentAnalytics('all'),
      analyticsRepository.getResourceAnalytics(),
      analyticsRepository.getTeamAnalytics(),
      analyticsRepository.getShelterAnalytics(),
      analyticsRepository.getAlertAnalytics(),
      analyticsRepository.getDamageAnalytics(),
    ]);

  const insights = generateInsights({
    incidents,
    resources,
    teams,
    shelters,
    alerts,
    damage,
    ai,
  });

  return {
    ...ai,
    insights,
  };
}

async function getRiskHotspots() {
  return await analyticsRepository.getRiskHotspots();
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
