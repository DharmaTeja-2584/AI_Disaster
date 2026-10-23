const { pool } = require('./index');

/**
 * Analytics Repository
 * Executes high-performance parameterized SQL aggregation queries.
 * NO simulated or hardcoded values.
 */

function buildDateFilter(period, fieldName = 'REPORTED_TIME') {
  if (period === 'today') {
    return ` AND DATE(${fieldName}) = CURDATE()`;
  }
  if (period === '7d') {
    return ` AND ${fieldName} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
  }
  if (period === '30d') {
    return ` AND ${fieldName} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
  }
  return '';
}

async function getIncidentAnalytics(period = 'all') {
  const dateFilter = buildDateFilter(period, 'i.REPORTED_TIME');

  // 1. Overall counts
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN i.STATUS IN ('Active', 'Triaged', 'Reported') THEN 1 ELSE 0 END), 0) AS active,
      COALESCE(SUM(CASE WHEN i.STATUS = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved,
      COALESCE(SUM(CASE WHEN i.STATUS = 'Contained' THEN 1 ELSE 0 END), 0) AS contained,
      COALESCE(SUM(CASE WHEN CAST(i.SEVERITY AS UNSIGNED) >= 7 THEN 1 ELSE 0 END), 0) AS highPriority,
      COALESCE(SUM(CASE WHEN CAST(i.SEVERITY AS UNSIGNED) BETWEEN 4 AND 6 THEN 1 ELSE 0 END), 0) AS mediumPriority,
      COALESCE(SUM(CASE WHEN CAST(i.SEVERITY AS UNSIGNED) <= 3 THEN 1 ELSE 0 END), 0) AS lowPriority
    FROM \`incident\` i
    WHERE 1=1 ${dateFilter}
  `);

  // 2. Breakdown by disaster type
  const [byType] = await pool.query(`
    SELECT i.INCIDENT_TYPE AS type, COUNT(*) AS count
    FROM \`incident\` i
    WHERE 1=1 ${dateFilter}
    GROUP BY i.INCIDENT_TYPE
    ORDER BY count DESC
  `);

  // 3. Breakdown by status
  const [byStatus] = await pool.query(`
    SELECT i.STATUS AS status, COUNT(*) AS count
    FROM \`incident\` i
    WHERE 1=1 ${dateFilter}
    GROUP BY i.STATUS
  `);

  // 4. Trends over time (Daily)
  const [trends] = await pool.query(`
    SELECT 
      DATE_FORMAT(i.REPORTED_TIME, '%Y-%m-%d') AS date,
      COUNT(*) AS reported,
      COALESCE(SUM(CASE WHEN i.STATUS = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved
    FROM \`incident\` i
    WHERE 1=1 ${dateFilter}
    GROUP BY DATE_FORMAT(i.REPORTED_TIME, '%Y-%m-%d')
    ORDER BY date ASC
    LIMIT 30
  `);

  return {
    stats: {
      total: Number(stats[0]?.total || 0),
      active: Number(stats[0]?.active || 0),
      resolved: Number(stats[0]?.resolved || 0),
      contained: Number(stats[0]?.contained || 0),
      highPriority: Number(stats[0]?.highPriority || 0),
      mediumPriority: Number(stats[0]?.mediumPriority || 0),
      lowPriority: Number(stats[0]?.lowPriority || 0),
    },
    byType,
    byStatus,
    trends,
  };
}

async function getResourceAnalytics() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalTypes,
      COALESCE(SUM(QUANTITY), 0) AS availableQuantity,
      COALESCE(SUM(CASE WHEN QUANTITY <= 20 OR AVAILABILITY = 'Low Stock' THEN 1 ELSE 0 END), 0) AS lowStockCount,
      COALESCE(SUM(CASE WHEN QUANTITY = 0 OR AVAILABILITY = 'Unavailable' THEN 1 ELSE 0 END), 0) AS depletedCount
    FROM \`resource\`
  `);

  const [allocStats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalAllocations,
      COALESCE(SUM(QUANTITY), 0) AS totalAllocatedQuantity
    FROM \`resource_allocation\`
  `);

  const [topAllocated] = await pool.query(`
    SELECT 
      r.RESOURCE_ID AS id,
      r.RESOURCE_NAME AS name,
      r.CATEGORY AS category,
      r.QUANTITY AS remainingStock,
      COALESCE(SUM(ra.QUANTITY), 0) AS allocatedQuantity,
      ROUND(
        (COALESCE(SUM(ra.QUANTITY), 0) / NULLIF(COALESCE(SUM(ra.QUANTITY), 0) + r.QUANTITY, 0)) * 100, 
        1
      ) AS utilizationPct
    FROM \`resource\` r
    LEFT JOIN \`resource_allocation\` ra ON r.RESOURCE_ID = ra.RESOURCE_ID
    GROUP BY r.RESOURCE_ID
    ORDER BY allocatedQuantity DESC
    LIMIT 8
  `);

  return {
    totalTypes: Number(stats[0]?.totalTypes || 0),
    availableQuantity: Number(stats[0]?.availableQuantity || 0),
    totalAllocatedQuantity: Number(allocStats[0]?.totalAllocatedQuantity || 0),
    lowStockCount: Number(stats[0]?.lowStockCount || 0),
    depletedCount: Number(stats[0]?.depletedCount || 0),
    totalAllocations: Number(allocStats[0]?.totalAllocations || 0),
    topAllocated,
  };
}

async function getTeamAnalytics() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalTeams,
      COALESCE(SUM(CASE WHEN AVAILABILITY = 'Available' THEN 1 ELSE 0 END), 0) AS available,
      COALESCE(SUM(CASE WHEN AVAILABILITY = 'Deployed' THEN 1 ELSE 0 END), 0) AS deployed,
      COALESCE(SUM(CASE WHEN AVAILABILITY = 'Off-Duty' THEN 1 ELSE 0 END), 0) AS offDuty
    FROM \`response_team\`
  `);

  const [dispatchStats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalDispatches,
      COALESCE(SUM(CASE WHEN STATUS = 'Deployed' THEN 1 ELSE 0 END), 0) AS activeDispatches,
      COALESCE(SUM(CASE WHEN STATUS = 'Released' THEN 1 ELSE 0 END), 0) AS releasedDispatches
    FROM \`incident_dispatch\`
  `);

  const [topTeams] = await pool.query(`
    SELECT 
      t.TEAM_ID AS id,
      t.TEAM_NAME AS name,
      t.SPECIALIZATION AS specialization,
      t.AVAILABILITY AS availability,
      COUNT(d.DISPATCH_ID) AS dispatchCount
    FROM \`response_team\` t
    LEFT JOIN \`incident_dispatch\` d ON t.TEAM_ID = d.TEAM_ID
    GROUP BY t.TEAM_ID
    ORDER BY dispatchCount DESC
    LIMIT 8
  `);

  const total = Number(stats[0]?.totalTeams || 0);
  const deployed = Number(stats[0]?.deployed || 0);
  const utilization = total > 0 ? parseFloat(((deployed / total) * 100).toFixed(1)) : 0;

  return {
    totalTeams: total,
    availableTeams: Number(stats[0]?.available || 0),
    deployedTeams: deployed,
    offDutyTeams: Number(stats[0]?.offDuty || 0),
    utilizationRate: utilization,
    totalDispatches: Number(dispatchStats[0]?.totalDispatches || 0),
    activeDispatches: Number(dispatchStats[0]?.activeDispatches || 0),
    releasedDispatches: Number(dispatchStats[0]?.releasedDispatches || 0),
    topTeams,
  };
}

async function getShelterAnalytics() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalShelters,
      COALESCE(SUM(CAPACITY), 0) AS totalCapacity,
      COALESCE(SUM(AVAILABLE_SPACES), 0) AS availableSpaces,
      COALESCE(SUM(CAPACITY - AVAILABLE_SPACES), 0) AS occupiedSpaces,
      COALESCE(SUM(CASE WHEN AVAILABLE_SPACES = 0 THEN 1 ELSE 0 END), 0) AS fullShelters,
      COALESCE(SUM(CASE WHEN AVAILABLE_SPACES > 0 AND AVAILABLE_SPACES <= FLOOR(CAPACITY * 0.15) THEN 1 ELSE 0 END), 0) AS nearCapacityShelters
    FROM \`shelter\`
  `);

  const totalCap = Number(stats[0]?.totalCapacity || 0);
  const occupied = Number(stats[0]?.occupiedSpaces || 0);
  const occupancyPct = totalCap > 0 ? parseFloat(((occupied / totalCap) * 100).toFixed(1)) : 0;

  const [shelterList] = await pool.query(`
    SELECT 
      SHELTER_ID AS id,
      SHELTER_NAME AS name,
      CAPACITY AS capacity,
      AVAILABLE_SPACES AS availableSpaces,
      (CAPACITY - AVAILABLE_SPACES) AS occupiedSpaces,
      ROUND(((CAPACITY - AVAILABLE_SPACES) / NULLIF(CAPACITY, 0)) * 100, 1) AS occupancyPct,
      LOCATION AS location
    FROM \`shelter\`
    ORDER BY occupancyPct DESC
    LIMIT 10
  `);

  return {
    totalShelters: Number(stats[0]?.totalShelters || 0),
    totalCapacity: totalCap,
    availableSpaces: Number(stats[0]?.availableSpaces || 0),
    occupiedSpaces: occupied,
    occupancyRate: occupancyPct,
    fullShelters: Number(stats[0]?.fullShelters || 0),
    nearCapacityShelters: Number(stats[0]?.nearCapacityShelters || 0),
    shelterList,
  };
}

async function getAlertAnalytics() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN PRIORITY = 'Critical' THEN 1 ELSE 0 END), 0) AS critical,
      COALESCE(SUM(CASE WHEN PRIORITY = 'Warning' THEN 1 ELSE 0 END), 0) AS warning,
      COALESCE(SUM(CASE WHEN PRIORITY = 'Info' THEN 1 ELSE 0 END), 0) AS info
    FROM \`alert\`
  `);

  const [ackStats] = await pool.query(`
    SELECT COUNT(*) AS totalAcks FROM \`alert_acknowledgement\`
  `);

  return {
    total: Number(stats[0]?.total || 0),
    critical: Number(stats[0]?.critical || 0),
    warning: Number(stats[0]?.warning || 0),
    info: Number(stats[0]?.info || 0),
    totalAcknowledgements: Number(ackStats[0]?.totalAcks || 0),
  };
}

async function getDamageAnalytics() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalReports,
      COALESCE(SUM(ESTIMATED_LOSS), 0) AS totalEstimatedLoss,
      COALESCE(AVG(ESTIMATED_LOSS), 0) AS averageLoss,
      COALESCE(SUM(CASE WHEN DAMAGE_LEVEL = 'Minor' THEN 1 ELSE 0 END), 0) AS minor,
      COALESCE(SUM(CASE WHEN DAMAGE_LEVEL = 'Moderate' THEN 1 ELSE 0 END), 0) AS moderate,
      COALESCE(SUM(CASE WHEN DAMAGE_LEVEL = 'Severe' THEN 1 ELSE 0 END), 0) AS severe,
      COALESCE(SUM(CASE WHEN DAMAGE_LEVEL = 'Critical' THEN 1 ELSE 0 END), 0) AS critical
    FROM \`damage_report\`
  `);

  return {
    totalReports: Number(stats[0]?.totalReports || 0),
    totalEstimatedLoss: Number(stats[0]?.totalEstimatedLoss || 0),
    averageLoss: parseFloat(Number(stats[0]?.averageLoss || 0).toFixed(2)),
    byLevel: {
      minor: Number(stats[0]?.minor || 0),
      moderate: Number(stats[0]?.moderate || 0),
      severe: Number(stats[0]?.severe || 0),
      critical: Number(stats[0]?.critical || 0),
    },
  };
}

async function getAiAnalytics() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) AS totalPredictions,
      COALESCE(ROUND(AVG(CONFIDENCE), 2), 0) AS averageConfidence,
      COALESCE(SUM(CASE WHEN RISK_LEVEL = 'High' THEN 1 ELSE 0 END), 0) AS highRisk,
      COALESCE(SUM(CASE WHEN RISK_LEVEL = 'Medium' THEN 1 ELSE 0 END), 0) AS mediumRisk,
      COALESCE(SUM(CASE WHEN RISK_LEVEL = 'Low' THEN 1 ELSE 0 END), 0) AS lowRisk,
      COALESCE(SUM(CASE WHEN CONFIDENCE < 70 THEN 1 ELSE 0 END), 0) AS lowConfidence
    FROM \`ai_prediction\`
  `);

  // Count incidents with secondary reassessment
  const [escalations] = await pool.query(`
    SELECT COUNT(DISTINCT INCIDENT_ID) AS reassessedIncidents
    FROM \`ai_prediction\`
    WHERE INCIDENT_ID IN (
      SELECT INCIDENT_ID FROM \`ai_prediction\` GROUP BY INCIDENT_ID HAVING COUNT(*) > 1
    )
  `);

  return {
    totalPredictions: Number(stats[0]?.totalPredictions || 0),
    averageConfidence: parseFloat(stats[0]?.averageConfidence || 0),
    highRiskCount: Number(stats[0]?.highRisk || 0),
    mediumRiskCount: Number(stats[0]?.mediumRisk || 0),
    lowRiskCount: Number(stats[0]?.lowRisk || 0),
    lowConfidenceCount: Number(stats[0]?.lowConfidence || 0),
    reassessedIncidents: Number(escalations[0]?.reassessedIncidents || 0),
  };
}

async function getRiskHotspots() {
  const [rows] = await pool.query(`
    SELECT 
      i.INCIDENT_ID AS id,
      i.INCIDENT_TYPE AS type,
      CAST(i.SEVERITY AS UNSIGNED) AS severity,
      i.STATUS AS status,
      i.LATITUDE AS lat,
      i.LONGITUDE AS lng,
      i.DESCRIPTION AS description,
      i.REPORTED_TIME AS reportedTime
    FROM \`incident\` i
    WHERE i.LATITUDE IS NOT NULL AND i.LONGITUDE IS NOT NULL
    ORDER BY CAST(i.SEVERITY AS UNSIGNED) DESC, i.REPORTED_TIME DESC
    LIMIT 60
  `);

  return rows;
}

module.exports = {
  getIncidentAnalytics,
  getResourceAnalytics,
  getTeamAnalytics,
  getShelterAnalytics,
  getAlertAnalytics,
  getDamageAnalytics,
  getAiAnalytics,
  getRiskHotspots,
};
