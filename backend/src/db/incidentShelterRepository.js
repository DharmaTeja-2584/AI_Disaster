const { pool } = require('./index');

/**
 * Incident Shelter Repository
 * Table: incident_shelter
 * Columns: ASSIGNMENT_ID, INCIDENT_ID, SHELTER_ID, ASSIGNED_SPACES, ASSIGNED_TIME, STATUS
 */

async function getNextAssignmentId(connection) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(ASSIGNMENT_ID), 0) + 1 AS nextId FROM `incident_shelter` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createAssignment(
  { incidentId, shelterId, assignedSpaces, assignedTime = new Date(), status = 'Assigned' },
  connection = pool
) {
  const nextId = await getNextAssignmentId(connection);

  await connection.execute(
    'INSERT INTO `incident_shelter` (ASSIGNMENT_ID, INCIDENT_ID, SHELTER_ID, ASSIGNED_SPACES, ASSIGNED_TIME, STATUS) VALUES (?, ?, ?, ?, ?, ?)',
    [nextId, incidentId, shelterId, assignedSpaces, assignedTime, status]
  );

  return {
    assignmentId: nextId,
    incidentId,
    shelterId,
    assignedSpaces,
    assignedTime,
    status,
  };
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      isa.ASSIGNMENT_ID AS assignmentId,
      isa.INCIDENT_ID AS incidentId,
      isa.SHELTER_ID AS shelterId,
      isa.ASSIGNED_SPACES AS assignedSpaces,
      isa.ASSIGNED_TIME AS assignedTime,
      isa.STATUS AS status,
      s.SHELTER_NAME AS shelterName,
      s.CAPACITY AS capacity,
      s.AVAILABLE_SPACES AS availableSpaces,
      s.LOCATION AS location
    FROM \`incident_shelter\` isa
    INNER JOIN \`shelter\` s ON isa.SHELTER_ID = s.SHELTER_ID
    WHERE isa.ASSIGNMENT_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByIncidentId(incidentId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      isa.ASSIGNMENT_ID AS assignmentId,
      isa.INCIDENT_ID AS incidentId,
      isa.SHELTER_ID AS shelterId,
      isa.ASSIGNED_SPACES AS assignedSpaces,
      isa.ASSIGNED_TIME AS assignedTime,
      isa.STATUS AS status,
      s.SHELTER_NAME AS shelterName,
      s.CAPACITY AS capacity,
      s.AVAILABLE_SPACES AS availableSpaces,
      s.LOCATION AS location
    FROM \`incident_shelter\` isa
    INNER JOIN \`shelter\` s ON isa.SHELTER_ID = s.SHELTER_ID
    WHERE isa.INCIDENT_ID = ?
    ORDER BY isa.ASSIGNED_TIME DESC`,
    [incidentId]
  );
  return rows;
}

async function updateStatus(id, status, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `incident_shelter` SET STATUS = ? WHERE ASSIGNMENT_ID = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getNextAssignmentId,
  createAssignment,
  findById,
  findByIncidentId,
  updateStatus,
};
