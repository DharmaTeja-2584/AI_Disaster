const { pool } = require('./index');

/**
 * Dashboard Repository
 * Computes live operational metrics directly from MySQL without hardcoded data.
 */

async function getMetrics() {
  // 1. Incidents Metrics (Active, High Priority, Resolved Today)
  const [incidentStats] = await pool.query(`
    SELECT
      COUNT(CASE WHEN STATUS IN ('Reported', 'Triaged', 'Active') THEN 1 END) AS activeIncidents,
      COUNT(CASE WHEN CAST(SEVERITY AS UNSIGNED) >= 7 THEN 1 END) AS highPriorityIncidents,
      COUNT(CASE WHEN STATUS = 'Resolved' AND DATE(REPORTED_TIME) = CURDATE() THEN 1 END) AS resolvedToday,
      COUNT(*) AS totalIncidents
    FROM \`incident\`
  `);

  // 2. Response Teams Metrics (Deployed vs Available)
  const [teamStats] = await pool.query(`
    SELECT
      COUNT(CASE WHEN LOWER(AVAILABILITY) = 'deployed' THEN 1 END) AS teamsDeployed,
      COUNT(CASE WHEN LOWER(AVAILABILITY) = 'available' THEN 1 END) AS teamsAvailable,
      COUNT(*) AS totalTeams
    FROM \`response_team\`
  `);

  // 3. Resource Metrics (Critical Resources)
  const [resourceStats] = await pool.query(`
    SELECT
      COUNT(CASE WHEN LOWER(AVAILABILITY) IN ('low stock', 'depleted', 'unavailable') OR QUANTITY <= 20 THEN 1 END) AS criticalResources,
      COUNT(*) AS totalResources
    FROM \`resource\`
  `);

  // 4. Shelter Capacity Metrics (Total Capacity vs Available Spaces)
  const [shelterStats] = await pool.query(`
    SELECT
      COALESCE(SUM(CAPACITY), 0) AS totalCapacity,
      COALESCE(SUM(AVAILABLE_SPACES), 0) AS totalAvailableSpaces,
      COUNT(*) AS totalShelters
    FROM \`shelter\`
  `);

  // 5. AI Prediction Metrics (Average Confidence)
  const [aiStats] = await pool.query(`
    SELECT
      COALESCE(ROUND(AVG(CONFIDENCE), 1), 0) AS avgConfidence,
      COUNT(*) AS totalPredictions
    FROM \`ai_prediction\`
  `);

  const inc = incidentStats[0] || {};
  const team = teamStats[0] || {};
  const res = resourceStats[0] || {};
  const shl = shelterStats[0] || {};
  const ai = aiStats[0] || {};

  return {
    activeIncidents: Number(inc.activeIncidents || 0),
    highPriorityIncidents: Number(inc.highPriorityIncidents || 0),
    resolvedToday: Number(inc.resolvedToday || 0),
    totalIncidents: Number(inc.totalIncidents || 0),
    teamsDeployed: Number(team.teamsDeployed || 0),
    teamsAvailable: Number(team.teamsAvailable || 0),
    totalTeams: Number(team.totalTeams || 0),
    criticalResources: Number(res.criticalResources || 0),
    totalResources: Number(res.totalResources || 0),
    shelterCapacity: {
      total: Number(shl.totalCapacity || 0),
      available: Number(shl.totalAvailableSpaces || 0),
      occupied: Math.max(0, Number(shl.totalCapacity || 0) - Number(shl.totalAvailableSpaces || 0)),
      totalShelters: Number(shl.totalShelters || 0),
    },
    aiConfidence: Number(ai.avgConfidence || 0),
    totalPredictions: Number(ai.totalPredictions || 0),
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = {
  getMetrics,
};
