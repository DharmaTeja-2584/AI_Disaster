const { pool } = require('./index');

/**
 * Incident Alert Junction Repository
 * Table: incident_alert
 * Columns: INCIDENT_ALERT_ID, INCIDENT_ID, ALERT_ID
 */

async function getNextIncidentAlertId(connection = pool) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(INCIDENT_ALERT_ID), 0) + 1 AS nextId FROM `incident_alert` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createIncidentAlert({ incidentId, alertId }, connection = pool) {
  const nextId = await getNextIncidentAlertId(connection);

  await connection.execute(
    'INSERT INTO `incident_alert` (INCIDENT_ALERT_ID, INCIDENT_ID, ALERT_ID) VALUES (?, ?, ?)',
    [nextId, incidentId, alertId]
  );

  return {
    incidentAlertId: nextId,
    incidentId,
    alertId,
  };
}

async function findByIncidentId(incidentId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      ia.INCIDENT_ALERT_ID AS incidentAlertId,
      ia.INCIDENT_ID AS incidentId,
      ia.ALERT_ID AS alertId,
      a.TITLE AS title,
      a.MESSAGE AS message,
      a.PRIORITY AS priority,
      a.ALERT_TIME AS alertTime
    FROM \`incident_alert\` ia
    INNER JOIN \`alert\` a ON ia.ALERT_ID = a.ALERT_ID
    WHERE ia.INCIDENT_ID = ?
    ORDER BY a.ALERT_TIME DESC`,
    [incidentId]
  );
  return rows;
}

async function findByAlertId(alertId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      ia.INCIDENT_ALERT_ID AS incidentAlertId,
      ia.INCIDENT_ID AS incidentId,
      ia.ALERT_ID AS alertId,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS severity,
      i.STATUS AS status
    FROM \`incident_alert\` ia
    INNER JOIN \`incident\` i ON ia.INCIDENT_ID = i.INCIDENT_ID
    WHERE ia.ALERT_ID = ?`,
    [alertId]
  );
  return rows;
}

module.exports = {
  getNextIncidentAlertId,
  createIncidentAlert,
  findByIncidentId,
  findByAlertId,
};
