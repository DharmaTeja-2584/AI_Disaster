const { pool } = require('./index');

/**
 * Audit Repository
 * Table: audit_log
 * Columns: AUDIT_ID, USER_ID, ACTION, ENTITY_TYPE, ENTITY_ID, DETAILS, CREATED_TIME
 */

async function getNextAuditId(connection = pool) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(AUDIT_ID), 0) + 1 AS nextId FROM `audit_log` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createAuditLog(
  { userId = null, action, entityType = null, entityId = null, details = null, createdTime = new Date() },
  connection = pool
) {
  const nextId = await getNextAuditId(connection);

  await connection.execute(
    'INSERT INTO `audit_log` (AUDIT_ID, USER_ID, ACTION, ENTITY_TYPE, ENTITY_ID, DETAILS, CREATED_TIME) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      nextId,
      userId ? Number(userId) : null,
      String(action).substring(0, 100),
      entityType ? String(entityType).substring(0, 100) : null,
      entityId ? Number(entityId) : null,
      details ? String(details).substring(0, 500) : null,
      createdTime,
    ]
  );

  return {
    auditId: nextId,
    userId,
    action,
    entityType,
    entityId,
    details,
    createdTime,
  };
}

async function findAll(
  { userId, action, entityType, search, startDate, endDate, limit = 20, offset = 0 } = {},
  connection = pool
) {
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (userId) {
    whereClause += ' AND al.USER_ID = ?';
    params.push(Number(userId));
  }

  if (action && action !== 'All') {
    whereClause += ' AND al.ACTION = ?';
    params.push(action);
  }

  if (entityType && entityType !== 'All') {
    whereClause += ' AND al.ENTITY_TYPE = ?';
    params.push(entityType);
  }

  if (search && search.trim()) {
    whereClause += ' AND (al.DETAILS LIKE ? OR al.ACTION LIKE ? OR u.USER_NAME LIKE ?)';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  if (startDate) {
    whereClause += ' AND al.CREATED_TIME >= ?';
    params.push(new Date(startDate));
  }

  if (endDate) {
    whereClause += ' AND al.CREATED_TIME <= ?';
    params.push(new Date(endDate));
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM \`audit_log\` al
    LEFT JOIN \`user\` u ON al.USER_ID = u.USER_ID
    ${whereClause}
  `;
  const [countRows] = await connection.query(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  const query = `
    SELECT 
      al.AUDIT_ID AS auditId,
      al.USER_ID AS userId,
      al.ACTION AS action,
      al.ENTITY_TYPE AS entityType,
      al.ENTITY_ID AS entityId,
      al.DETAILS AS details,
      al.CREATED_TIME AS createdTime,
      u.USER_NAME AS userName,
      u.EMAIL AS userEmail,
      u.ROLE AS userRole
    FROM \`audit_log\` al
    LEFT JOIN \`user\` u ON al.USER_ID = u.USER_ID
    ${whereClause}
    ORDER BY al.CREATED_TIME DESC, al.AUDIT_ID DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, Number(limit), Number(offset)];
  const [rows] = await connection.query(query, queryParams);

  return {
    logs: rows,
    total,
  };
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      al.AUDIT_ID AS auditId,
      al.USER_ID AS userId,
      al.ACTION AS action,
      al.ENTITY_TYPE AS entityType,
      al.ENTITY_ID AS entityId,
      al.DETAILS AS details,
      al.CREATED_TIME AS createdTime,
      u.USER_NAME AS userName,
      u.EMAIL AS userEmail,
      u.ROLE AS userRole
    FROM \`audit_log\` al
    LEFT JOIN \`user\` u ON al.USER_ID = u.USER_ID
    WHERE al.AUDIT_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  getNextAuditId,
  createAuditLog,
  findAll,
  findById,
};
