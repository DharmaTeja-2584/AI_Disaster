const { pool } = require('./index');

/**
 * Response Team Repository
 * Maps directly to table: response_team
 * Columns: TEAM_ID, TEAM_NAME, LEADER, SPECIALIZATION, AVAILABILITY, LATITUDE, LONGITUDE
 */

async function getNextTeamId(connection) {
  const [rows] = await connection.query('SELECT COALESCE(MAX(TEAM_ID), 0) + 1 AS nextId FROM `response_team` FOR UPDATE');
  return rows[0].nextId;
}

async function findAll({ availability, specialization } = {}) {
  let query = `
    SELECT 
      t.TEAM_ID AS id,
      t.TEAM_NAME AS name,
      t.LEADER AS leader,
      t.SPECIALIZATION AS specialization,
      t.AVAILABILITY AS availability,
      t.LATITUDE AS latitude,
      t.LONGITUDE AS longitude,
      (SELECT COUNT(*) FROM \`volunteer\` v WHERE v.TEAM_ID = t.TEAM_ID) AS memberCount,
      (SELECT d.INCIDENT_ID FROM \`incident_dispatch\` d WHERE d.TEAM_ID = t.TEAM_ID AND d.STATUS = 'Deployed' ORDER BY d.DISPATCH_TIME DESC LIMIT 1) AS assignedIncidentId
    FROM \`response_team\` t
    WHERE 1=1
  `;
  const params = [];

  if (availability && availability !== 'All') {
    query += ' AND LOWER(t.AVAILABILITY) = LOWER(?)';
    params.push(availability);
  }

  if (specialization && specialization !== 'All') {
    query += ' AND LOWER(t.SPECIALIZATION) = LOWER(?)';
    params.push(specialization);
  }

  query += ' ORDER BY t.TEAM_ID ASC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      t.TEAM_ID AS id,
      t.TEAM_NAME AS name,
      t.LEADER AS leader,
      t.SPECIALIZATION AS specialization,
      t.AVAILABILITY AS availability,
      t.LATITUDE AS latitude,
      t.LONGITUDE AS longitude
    FROM \`response_team\` t
    WHERE t.TEAM_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findAvailable(connection = pool) {
  const [rows] = await connection.query(
    `SELECT 
      TEAM_ID AS id,
      TEAM_NAME AS name,
      LEADER AS leader,
      SPECIALIZATION AS specialization,
      AVAILABILITY AS availability,
      LATITUDE AS latitude,
      LONGITUDE AS longitude
    FROM \`response_team\`
    WHERE LOWER(AVAILABILITY) = 'available'`
  );
  return rows;
}

async function updateStatus(id, status, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `response_team` SET AVAILABILITY = ? WHERE TEAM_ID = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findAvailable,
  updateStatus,
};
