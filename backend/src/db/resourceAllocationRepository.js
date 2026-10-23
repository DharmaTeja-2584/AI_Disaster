const { pool } = require('./index');

/**
 * Resource Allocation Repository
 * Table: resource_allocation
 * Columns: ALLOCATION_ID, INCIDENT_ID, RESOURCE_ID, QUANTITY, ASSIGNED_TIME, STATUS
 */

async function getNextAllocationId(connection) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(ALLOCATION_ID), 0) + 1 AS nextId FROM `resource_allocation` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createAllocation(
  { incidentId, resourceId, quantity, assignedTime = new Date(), status = 'Allocated' },
  connection = pool
) {
  const nextId = await getNextAllocationId(connection);

  await connection.execute(
    'INSERT INTO `resource_allocation` (ALLOCATION_ID, INCIDENT_ID, RESOURCE_ID, QUANTITY, ASSIGNED_TIME, STATUS) VALUES (?, ?, ?, ?, ?, ?)',
    [nextId, incidentId, resourceId, quantity, assignedTime, status]
  );

  return {
    allocationId: nextId,
    incidentId,
    resourceId,
    quantity,
    assignedTime,
    status,
  };
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      ra.ALLOCATION_ID AS allocationId,
      ra.INCIDENT_ID AS incidentId,
      ra.RESOURCE_ID AS resourceId,
      ra.QUANTITY AS quantity,
      ra.ASSIGNED_TIME AS assignedTime,
      ra.STATUS AS status,
      r.RESOURCE_NAME AS resourceName,
      r.CATEGORY AS category,
      r.LOCATION AS location
    FROM \`resource_allocation\` ra
    INNER JOIN \`resource\` r ON ra.RESOURCE_ID = r.RESOURCE_ID
    WHERE ra.ALLOCATION_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByIncidentId(incidentId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      ra.ALLOCATION_ID AS allocationId,
      ra.INCIDENT_ID AS incidentId,
      ra.RESOURCE_ID AS resourceId,
      ra.QUANTITY AS quantity,
      ra.ASSIGNED_TIME AS assignedTime,
      ra.STATUS AS status,
      r.RESOURCE_NAME AS resourceName,
      r.CATEGORY AS category,
      r.LOCATION AS location
    FROM \`resource_allocation\` ra
    INNER JOIN \`resource\` r ON ra.RESOURCE_ID = r.RESOURCE_ID
    WHERE ra.INCIDENT_ID = ?
    ORDER BY ra.ASSIGNED_TIME DESC`,
    [incidentId]
  );
  return rows;
}

async function updateStatus(id, status, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `resource_allocation` SET STATUS = ? WHERE ALLOCATION_ID = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getNextAllocationId,
  createAllocation,
  findById,
  findByIncidentId,
  updateStatus,
};
