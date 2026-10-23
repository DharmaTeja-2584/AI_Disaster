const { pool } = require('./index');

/**
 * Incident Dispatch Repository
 * Maps directly to junction table: incident_dispatch
 * Columns: DISPATCH_ID, INCIDENT_ID, TEAM_ID, DISPATCH_TIME, STATUS
 */

async function getNextDispatchId(connection) {
  const [rows] = await connection.query('SELECT COALESCE(MAX(DISPATCH_ID), 0) + 1 AS nextId FROM `incident_dispatch` FOR UPDATE');
  return rows[0].nextId;
}

async function createDispatch({ incidentId, teamId, dispatchTime = new Date(), status = 'Deployed' }, connection = pool) {
  const nextId = await getNextDispatchId(connection);

  await connection.execute(
    'INSERT INTO `incident_dispatch` (DISPATCH_ID, INCIDENT_ID, TEAM_ID, DISPATCH_TIME, STATUS) VALUES (?, ?, ?, ?, ?)',
    [nextId, incidentId, teamId, dispatchTime, status]
  );

  return {
    dispatchId: nextId,
    incidentId,
    teamId,
    dispatchTime,
    status,
  };
}

async function findByIncidentId(incidentId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      d.DISPATCH_ID AS dispatchId,
      d.INCIDENT_ID AS incidentId,
      d.TEAM_ID AS teamId,
      d.DISPATCH_TIME AS dispatchTime,
      d.STATUS AS status,
      t.TEAM_NAME AS teamName,
      t.LEADER AS leader,
      t.SPECIALIZATION AS specialization,
      t.LATITUDE AS latitude,
      t.LONGITUDE AS longitude
    FROM \`incident_dispatch\` d
    INNER JOIN \`response_team\` t ON d.TEAM_ID = t.TEAM_ID
    WHERE d.INCIDENT_ID = ?
    ORDER BY d.DISPATCH_TIME DESC`,
    [incidentId]
  );
  return rows;
}

async function findActiveByIncidentId(incidentId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      d.DISPATCH_ID AS dispatchId,
      d.INCIDENT_ID AS incidentId,
      d.TEAM_ID AS teamId,
      d.DISPATCH_TIME AS dispatchTime,
      d.STATUS AS status
    FROM \`incident_dispatch\` d
    WHERE d.INCIDENT_ID = ? AND d.STATUS = 'Deployed'`,
    [incidentId]
  );
  return rows;
}

async function releaseIncidentDispatches(incidentId, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `incident_dispatch` SET STATUS = ? WHERE INCIDENT_ID = ? AND STATUS = ?',
    ['Released', incidentId, 'Deployed']
  );
  return result.affectedRows;
}

module.exports = {
  createDispatch,
  findByIncidentId,
  findActiveByIncidentId,
  releaseIncidentDispatches,
};
