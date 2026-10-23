const { pool } = require('./index');

/**
 * Damage Report Repository
 * Tables: damage_report, incident_damage_report
 * damage_report columns: REPORT_ID, DAMAGE_LEVEL, ESTIMATED_LOSS, DESCRIPTION, PHOTO
 * incident_damage_report columns: INCIDENT_DAMAGE_ID, INCIDENT_ID, REPORT_ID
 */

async function getNextReportId(connection = pool) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(REPORT_ID), 0) + 1 AS nextId FROM `damage_report` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function getNextIncidentDamageId(connection = pool) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(INCIDENT_DAMAGE_ID), 0) + 1 AS nextId FROM `incident_damage_report` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createDamageReport(
  { incidentId, damageLevel, estimatedLoss = 0, description, photo = null },
  connection = pool
) {
  const reportId = await getNextReportId(connection);

  await connection.execute(
    'INSERT INTO `damage_report` (REPORT_ID, DAMAGE_LEVEL, ESTIMATED_LOSS, DESCRIPTION, PHOTO) VALUES (?, ?, ?, ?, ?)',
    [reportId, damageLevel, estimatedLoss, description, photo]
  );

  let incidentDamageId = null;
  if (incidentId) {
    incidentDamageId = await getNextIncidentDamageId(connection);
    await connection.execute(
      'INSERT INTO `incident_damage_report` (INCIDENT_DAMAGE_ID, INCIDENT_ID, REPORT_ID) VALUES (?, ?, ?)',
      [incidentDamageId, incidentId, reportId]
    );
  }

  return {
    reportId,
    incidentDamageId,
    incidentId,
    damageLevel,
    estimatedLoss: Number(estimatedLoss),
    description,
    photo,
  };
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      dr.REPORT_ID AS reportId,
      dr.DAMAGE_LEVEL AS damageLevel,
      dr.ESTIMATED_LOSS AS estimatedLoss,
      dr.DESCRIPTION AS description,
      dr.PHOTO AS photo,
      idr.INCIDENT_ID AS incidentId,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS incidentSeverity,
      i.STATUS AS incidentStatus
    FROM \`damage_report\` dr
    LEFT JOIN \`incident_damage_report\` idr ON dr.REPORT_ID = idr.REPORT_ID
    LEFT JOIN \`incident\` i ON idr.INCIDENT_ID = i.INCIDENT_ID
    WHERE dr.REPORT_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByIncidentId(incidentId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      dr.REPORT_ID AS reportId,
      dr.DAMAGE_LEVEL AS damageLevel,
      dr.ESTIMATED_LOSS AS estimatedLoss,
      dr.DESCRIPTION AS description,
      dr.PHOTO AS photo,
      idr.INCIDENT_DAMAGE_ID AS incidentDamageId,
      idr.INCIDENT_ID AS incidentId
    FROM \`damage_report\` dr
    INNER JOIN \`incident_damage_report\` idr ON dr.REPORT_ID = idr.REPORT_ID
    WHERE idr.INCIDENT_ID = ?
    ORDER BY dr.REPORT_ID DESC`,
    [incidentId]
  );
  return rows;
}

async function findAll({ damageLevel, search, limit = 20, offset = 0 } = {}, connection = pool) {
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (damageLevel && damageLevel !== 'All') {
    whereClause += ' AND dr.DAMAGE_LEVEL = ?';
    params.push(damageLevel);
  }

  if (search && search.trim()) {
    whereClause += ' AND (dr.DESCRIPTION LIKE ? OR CAST(dr.REPORT_ID AS CHAR) LIKE ?)';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  const countQuery = `
    SELECT COUNT(DISTINCT dr.REPORT_ID) AS total
    FROM \`damage_report\` dr
    LEFT JOIN \`incident_damage_report\` idr ON dr.REPORT_ID = idr.REPORT_ID
    ${whereClause}
  `;
  const [countRows] = await connection.query(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  const query = `
    SELECT 
      dr.REPORT_ID AS reportId,
      dr.DAMAGE_LEVEL AS damageLevel,
      dr.ESTIMATED_LOSS AS estimatedLoss,
      dr.DESCRIPTION AS description,
      dr.PHOTO AS photo,
      idr.INCIDENT_ID AS incidentId,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS incidentSeverity,
      i.STATUS AS incidentStatus
    FROM \`damage_report\` dr
    LEFT JOIN \`incident_damage_report\` idr ON dr.REPORT_ID = idr.REPORT_ID
    LEFT JOIN \`incident\` i ON idr.INCIDENT_ID = i.INCIDENT_ID
    ${whereClause}
    ORDER BY dr.REPORT_ID DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, Number(limit), Number(offset)];
  const [rows] = await connection.query(query, queryParams);

  return {
    damageReports: rows,
    total,
  };
}

module.exports = {
  getNextReportId,
  getNextIncidentDamageId,
  createDamageReport,
  findById,
  findByIncidentId,
  findAll,
};
