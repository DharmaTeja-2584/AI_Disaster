const { pool } = require('./index');

/**
 * Incident Repository
 * Maps directly to table: incident
 * Columns: INCIDENT_ID, INCIDENT_TYPE, SEVERITY, DESCRIPTION, LATITUDE, LONGITUDE, STATUS, REPORTED_TIME
 */

async function getNextIncidentId(connection) {
  const [rows] = await connection.query('SELECT COALESCE(MAX(INCIDENT_ID), 0) + 1 AS nextId FROM `incident` FOR UPDATE');
  return rows[0].nextId;
}

async function createIncident({
  incidentType,
  severity,
  description,
  latitude,
  longitude,
  status = 'Reported',
  reportedTime = new Date(),
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const nextId = await getNextIncidentId(connection);

    await connection.execute(
      'INSERT INTO `incident` (INCIDENT_ID, INCIDENT_TYPE, SEVERITY, DESCRIPTION, LATITUDE, LONGITUDE, STATUS, REPORTED_TIME) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nextId,
        incidentType,
        String(severity),
        description,
        latitude,
        longitude,
        status,
        reportedTime,
      ]
    );

    await connection.commit();

    return {
      id: nextId,
      incidentType,
      severity: String(severity),
      description,
      latitude,
      longitude,
      status,
      reportedTime,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT 
      i.INCIDENT_ID AS id,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS severity,
      i.DESCRIPTION AS description,
      i.LATITUDE AS latitude,
      i.LONGITUDE AS longitude,
      i.STATUS AS status,
      i.REPORTED_TIME AS reportedTime,
      p.PREDICTION_ID AS predictionId,
      p.RISK_LEVEL AS riskLevel,
      p.CONFIDENCE AS confidence,
      p.SUGGESTED_ACTION AS suggestedAction,
      p.PREDICTION_TIME AS predictionTime
    FROM \`incident\` i
    LEFT JOIN (
      SELECT p1.INCIDENT_ID, p1.PREDICTION_ID, p1.RISK_LEVEL, p1.CONFIDENCE, p1.SUGGESTED_ACTION, p1.PREDICTION_TIME
      FROM \`ai_prediction\` p1
      INNER JOIN (
        SELECT INCIDENT_ID, MAX(PREDICTION_ID) AS max_pred_id
        FROM \`ai_prediction\`
        GROUP BY INCIDENT_ID
      ) p2 ON p1.PREDICTION_ID = p2.max_pred_id
    ) p ON i.INCIDENT_ID = p.INCIDENT_ID
    WHERE i.INCIDENT_ID = ?`,
    [id]
  );

  if (!rows[0]) return null;
  const incident = rows[0];

  // Retrieve actual resource allocations if any exist (via resource_allocation -> resource)
  const [allocations] = await pool.execute(
    `SELECT 
      ra.ALLOCATION_ID AS allocationId,
      ra.QUANTITY AS quantity,
      ra.ASSIGNED_TIME AS assignedTime,
      ra.STATUS AS status,
      r.RESOURCE_ID AS resourceId,
      r.RESOURCE_NAME AS resourceName,
      r.CATEGORY AS category,
      r.LOCATION AS location
    FROM \`resource_allocation\` ra
    INNER JOIN \`resource\` r ON ra.RESOURCE_ID = r.RESOURCE_ID
    WHERE ra.INCIDENT_ID = ?
    ORDER BY ra.ASSIGNED_TIME DESC`,
    [id]
  );

  incident.allocations = allocations || [];

  // Retrieve actual response team dispatches (via incident_dispatch -> response_team)
  const [dispatches] = await pool.execute(
    `SELECT 
      d.DISPATCH_ID AS dispatchId,
      d.DISPATCH_TIME AS dispatchTime,
      d.STATUS AS status,
      t.TEAM_ID AS teamId,
      t.TEAM_NAME AS teamName,
      t.LEADER AS leader,
      t.SPECIALIZATION AS specialization,
      t.LATITUDE AS latitude,
      t.LONGITUDE AS longitude
    FROM \`incident_dispatch\` d
    INNER JOIN \`response_team\` t ON d.TEAM_ID = t.TEAM_ID
    WHERE d.INCIDENT_ID = ?
    ORDER BY d.DISPATCH_TIME DESC`,
    [id]
  );

  incident.dispatches = dispatches || [];
  incident.activeTeam = dispatches.find((d) => d.status === 'Deployed') || null;

  // Retrieve actual shelter assignments (via incident_shelter -> shelter)
  const [shelters] = await pool.execute(
    `SELECT 
      isa.ASSIGNMENT_ID AS assignmentId,
      isa.ASSIGNED_SPACES AS assignedSpaces,
      isa.ASSIGNED_TIME AS assignedTime,
      isa.STATUS AS status,
      s.SHELTER_ID AS shelterId,
      s.SHELTER_NAME AS shelterName,
      s.CAPACITY AS capacity,
      s.AVAILABLE_SPACES AS availableSpaces,
      s.LOCATION AS location
    FROM \`incident_shelter\` isa
    INNER JOIN \`shelter\` s ON isa.SHELTER_ID = s.SHELTER_ID
    WHERE isa.INCIDENT_ID = ?
    ORDER BY isa.ASSIGNED_TIME DESC`,
    [id]
  );

  incident.shelters = shelters || [];

  // Retrieve all AI predictions for historical analysis
  const [predictions] = await pool.execute(
    `SELECT 
      PREDICTION_ID AS predictionId,
      INCIDENT_ID AS incidentId,
      RISK_LEVEL AS riskLevel,
      CONFIDENCE AS confidence,
      SUGGESTED_ACTION AS suggestedAction,
      PREDICTION_TIME AS predictionTime
    FROM \`ai_prediction\`
    WHERE INCIDENT_ID = ?
    ORDER BY PREDICTION_TIME ASC`,
    [id]
  );
  incident.predictions = predictions || [];

  // Retrieve actual damage reports (via incident_damage_report -> damage_report)
  const [damageReports] = await pool.execute(
    `SELECT 
      dr.REPORT_ID AS reportId,
      dr.DAMAGE_LEVEL AS damageLevel,
      dr.ESTIMATED_LOSS AS estimatedLoss,
      dr.DESCRIPTION AS description,
      dr.PHOTO AS photo,
      idr.INCIDENT_DAMAGE_ID AS incidentDamageId
    FROM \`incident_damage_report\` idr
    INNER JOIN \`damage_report\` dr ON idr.REPORT_ID = dr.REPORT_ID
    WHERE idr.INCIDENT_ID = ?
    ORDER BY dr.REPORT_ID DESC`,
    [id]
  );
  incident.damageReports = damageReports || [];

  // Retrieve actual alerts linked to incident (via incident_alert -> alert)
  const [alerts] = await pool.execute(
    `SELECT 
      a.ALERT_ID AS alertId,
      a.TITLE AS title,
      a.MESSAGE AS message,
      a.PRIORITY AS priority,
      a.ALERT_TIME AS alertTime,
      ia.INCIDENT_ALERT_ID AS incidentAlertId
    FROM \`incident_alert\` ia
    INNER JOIN \`alert\` a ON ia.ALERT_ID = a.ALERT_ID
    WHERE ia.INCIDENT_ID = ?
    ORDER BY a.ALERT_TIME DESC`,
    [id]
  );
  incident.alerts = alerts || [];

  // Construct real operational timeline from database timestamps
  const timeline = [];

  if (incident.reportedTime) {
    timeline.push({
      type: 'REPORTED',
      title: 'Incident Reported',
      description: `${incident.incidentType} (Severity: ${incident.severity}/10) logged into EOC system.`,
      timestamp: incident.reportedTime,
    });
  }

  predictions.forEach((p, idx) => {
    timeline.push({
      type: idx === 0 ? 'AI_TRIAGE' : 'AI_REASSESSMENT',
      title: idx === 0 ? 'Initial AI Triage Completed' : 'Secondary AI Triage Reassessment',
      description: `Risk Level: ${p.riskLevel}, Confidence: ${p.confidence}%. Action: ${p.suggestedAction || 'Operational standby'}`,
      timestamp: p.predictionTime || incident.reportedTime,
    });
  });

  dispatches.forEach((d) => {
    timeline.push({
      type: 'DISPATCH',
      title: `Team Dispatched: ${d.teamName}`,
      description: `Status: ${d.status}, Leader: ${d.leader}, Spec: ${d.specialization}`,
      timestamp: d.dispatchTime,
    });
  });

  allocations.forEach((a) => {
    timeline.push({
      type: 'RESOURCE',
      title: `Resource Allocated: ${a.quantity}x ${a.resourceName}`,
      description: `Category: ${a.category}, Status: ${a.status}`,
      timestamp: a.assignedTime,
    });
  });

  shelters.forEach((s) => {
    timeline.push({
      type: 'SHELTER',
      title: `Shelter Assigned: ${s.assignedSpaces} Spaces`,
      description: `Facility: ${s.shelterName}, Status: ${s.status}`,
      timestamp: s.assignedTime,
    });
  });

  damageReports.forEach((dr) => {
    timeline.push({
      type: 'DAMAGE_REPORT',
      title: `Field Damage Assessment: ${dr.damageLevel}`,
      description: `Estimated Loss: $${Number(dr.estimatedLoss).toLocaleString()}. ${dr.description}`,
      timestamp: incident.reportedTime, // Sorted with damage assessments
    });
  });

  alerts.forEach((alt) => {
    timeline.push({
      type: 'ALERT',
      title: `Operational Alert: ${alt.title}`,
      description: `[${alt.priority}] ${alt.message}`,
      timestamp: alt.alertTime,
    });
  });

  // Sort timeline chronologically
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  incident.timeline = timeline;

  return incident;
}

async function findAll({
  search,
  status,
  severity,
  priority,
  incidentType,
  sortBy = 'severity_desc',
  limit = 10,
  offset = 0,
} = {}) {
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    whereClause += ' AND (i.INCIDENT_TYPE LIKE ? OR i.DESCRIPTION LIKE ? OR CAST(i.INCIDENT_ID AS CHAR) LIKE ?)';
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (status && status !== 'All') {
    whereClause += ' AND i.STATUS = ?';
    params.push(status);
  }

  if (severity) {
    whereClause += ' AND i.SEVERITY = ?';
    params.push(String(severity));
  }

  if (priority && priority !== 'All') {
    if (priority === 'High') {
      whereClause += ' AND CAST(i.SEVERITY AS UNSIGNED) >= 7';
    } else if (priority === 'Medium') {
      whereClause += ' AND CAST(i.SEVERITY AS UNSIGNED) BETWEEN 4 AND 6';
    } else if (priority === 'Low') {
      whereClause += ' AND CAST(i.SEVERITY AS UNSIGNED) <= 3';
    }
  }

  if (incidentType && incidentType !== 'All') {
    whereClause += ' AND i.INCIDENT_TYPE = ?';
    params.push(incidentType);
  }

  // Count total matching records
  const countQuery = `SELECT COUNT(*) AS total FROM \`incident\` i ${whereClause}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  // Sorting logic (safe numeric casting for severity)
  let orderClause = ' ORDER BY CAST(i.SEVERITY AS UNSIGNED) DESC, i.REPORTED_TIME DESC';
  if (sortBy === 'severity_asc') {
    orderClause = ' ORDER BY CAST(i.SEVERITY AS UNSIGNED) ASC, i.REPORTED_TIME DESC';
  } else if (sortBy === 'confidence_desc') {
    orderClause = ' ORDER BY p.CONFIDENCE DESC, i.REPORTED_TIME DESC';
  } else if (sortBy === 'time_desc') {
    orderClause = ' ORDER BY i.REPORTED_TIME DESC';
  } else if (sortBy === 'time_asc') {
    orderClause = ' ORDER BY i.REPORTED_TIME ASC';
  }

  const query = `
    SELECT 
      i.INCIDENT_ID AS id,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS severity,
      i.DESCRIPTION AS description,
      i.LATITUDE AS latitude,
      i.LONGITUDE AS longitude,
      i.STATUS AS status,
      i.REPORTED_TIME AS reportedTime,
      p.PREDICTION_ID AS predictionId,
      p.RISK_LEVEL AS riskLevel,
      p.CONFIDENCE AS confidence,
      p.SUGGESTED_ACTION AS suggestedAction,
      p.PREDICTION_TIME AS predictionTime,
      (
        SELECT t.TEAM_NAME 
        FROM \`incident_dispatch\` d 
        INNER JOIN \`response_team\` t ON d.TEAM_ID = t.TEAM_ID 
        WHERE d.INCIDENT_ID = i.INCIDENT_ID AND d.STATUS = 'Deployed' 
        ORDER BY d.DISPATCH_TIME DESC LIMIT 1
      ) AS assignedTeamName,
      (
        SELECT d.TEAM_ID 
        FROM \`incident_dispatch\` d 
        WHERE d.INCIDENT_ID = i.INCIDENT_ID AND d.STATUS = 'Deployed' 
        ORDER BY d.DISPATCH_TIME DESC LIMIT 1
      ) AS assignedTeamId
    FROM \`incident\` i
    LEFT JOIN (
      SELECT p1.INCIDENT_ID, p1.PREDICTION_ID, p1.RISK_LEVEL, p1.CONFIDENCE, p1.SUGGESTED_ACTION, p1.PREDICTION_TIME
      FROM \`ai_prediction\` p1
      INNER JOIN (
        SELECT INCIDENT_ID, MAX(PREDICTION_ID) AS max_pred_id
        FROM \`ai_prediction\`
        GROUP BY INCIDENT_ID
      ) p2 ON p1.PREDICTION_ID = p2.max_pred_id
    ) p ON i.INCIDENT_ID = p.INCIDENT_ID
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, Number(limit), Number(offset)];
  const [rows] = await pool.query(query, queryParams);

  return {
    incidents: rows,
    total,
  };
}

async function updateStatus(id, status) {
  const [result] = await pool.execute(
    'UPDATE \`incident\` SET STATUS = ? WHERE INCIDENT_ID = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createIncident,
  findById,
  findAll,
  updateStatus,
};
