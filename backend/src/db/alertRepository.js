const { pool } = require('./index');

/**
 * Alert Repository
 * Table: alert
 * Columns: ALERT_ID, TITLE, MESSAGE, PRIORITY, ALERT_TIME
 */

async function getNextAlertId(connection = pool) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(ALERT_ID), 0) + 1 AS nextId FROM `alert` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createAlert(
  { title, message, priority = 'Info', alertTime = new Date() },
  connection = pool
) {
  const nextId = await getNextAlertId(connection);

  await connection.execute(
    'INSERT INTO `alert` (ALERT_ID, TITLE, MESSAGE, PRIORITY, ALERT_TIME) VALUES (?, ?, ?, ?, ?)',
    [nextId, title, message, priority, alertTime]
  );

  return {
    alertId: nextId,
    title,
    message,
    priority,
    alertTime,
  };
}

async function findById(id, userId = null, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      a.ALERT_ID AS alertId,
      a.TITLE AS title,
      a.MESSAGE AS message,
      a.PRIORITY AS priority,
      a.ALERT_TIME AS alertTime,
      ia.INCIDENT_ID AS incidentId,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS incidentSeverity,
      (SELECT COUNT(*) FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID) AS ackCount,
      ${userId ? `(SELECT COUNT(*) > 0 FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID AND ak.USER_ID = ${Number(userId)})` : '0'} AS isAcknowledged
    FROM \`alert\` a
    LEFT JOIN \`incident_alert\` ia ON a.ALERT_ID = ia.ALERT_ID
    LEFT JOIN \`incident\` i ON ia.INCIDENT_ID = i.INCIDENT_ID
    WHERE a.ALERT_ID = ?`,
    [id]
  );

  if (!rows[0]) return null;

  const alert = {
    ...rows[0],
    isAcknowledged: Boolean(rows[0].isAcknowledged),
  };

  // Get acknowledgement details
  const [acks] = await connection.execute(
    `SELECT 
      ak.ACKNOWLEDGEMENT_ID AS acknowledgementId,
      ak.USER_ID AS userId,
      ak.ACKNOWLEDGED_TIME AS acknowledgedTime,
      u.USER_NAME AS userName,
      u.ROLE AS userRole
    FROM \`alert_acknowledgement\` ak
    LEFT JOIN \`user\` u ON ak.USER_ID = u.USER_ID
    WHERE ak.ALERT_ID = ?
    ORDER BY ak.ACKNOWLEDGED_TIME DESC`,
    [id]
  );

  alert.acknowledgements = acks || [];

  return alert;
}

async function findAll({
  search,
  priority,
  acknowledged,
  incidentId,
  limit = 20,
  offset = 0,
  userId = null,
} = {}, connection = pool) {
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    whereClause += ' AND (a.TITLE LIKE ? OR a.MESSAGE LIKE ?)';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  if (priority && priority !== 'All') {
    whereClause += ' AND a.PRIORITY = ?';
    params.push(priority);
  }

  if (incidentId) {
    whereClause += ' AND ia.INCIDENT_ID = ?';
    params.push(incidentId);
  }

  if (acknowledged !== undefined && acknowledged !== 'All') {
    if (userId) {
      if (acknowledged === 'true' || acknowledged === true || acknowledged === 'Acknowledged') {
        whereClause += ` AND EXISTS (SELECT 1 FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID AND ak.USER_ID = ?)`;
        params.push(userId);
      } else if (acknowledged === 'false' || acknowledged === false || acknowledged === 'Unread') {
        whereClause += ` AND NOT EXISTS (SELECT 1 FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID AND ak.USER_ID = ?)`;
        params.push(userId);
      }
    } else {
      if (acknowledged === 'true' || acknowledged === true || acknowledged === 'Acknowledged') {
        whereClause += ` AND EXISTS (SELECT 1 FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID)`;
      } else if (acknowledged === 'false' || acknowledged === false || acknowledged === 'Unread') {
        whereClause += ` AND NOT EXISTS (SELECT 1 FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID)`;
      }
    }
  }

  const countQuery = `
    SELECT COUNT(DISTINCT a.ALERT_ID) AS total
    FROM \`alert\` a
    LEFT JOIN \`incident_alert\` ia ON a.ALERT_ID = ia.ALERT_ID
    ${whereClause}
  `;
  const [countRows] = await connection.query(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  const query = `
    SELECT 
      a.ALERT_ID AS alertId,
      a.TITLE AS title,
      a.MESSAGE AS message,
      a.PRIORITY AS priority,
      a.ALERT_TIME AS alertTime,
      ia.INCIDENT_ID AS incidentId,
      i.INCIDENT_TYPE AS incidentType,
      i.SEVERITY AS incidentSeverity,
      (SELECT COUNT(*) FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID) AS ackCount,
      ${userId ? `(SELECT COUNT(*) > 0 FROM \`alert_acknowledgement\` ak WHERE ak.ALERT_ID = a.ALERT_ID AND ak.USER_ID = ${Number(userId)})` : '0'} AS isAcknowledged
    FROM \`alert\` a
    LEFT JOIN \`incident_alert\` ia ON a.ALERT_ID = ia.ALERT_ID
    LEFT JOIN \`incident\` i ON ia.INCIDENT_ID = i.INCIDENT_ID
    ${whereClause}
    ORDER BY 
      CASE a.PRIORITY
        WHEN 'Critical' THEN 1
        WHEN 'Warning' THEN 2
        WHEN 'Info' THEN 3
        ELSE 4
      END ASC,
      a.ALERT_TIME DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, Number(limit), Number(offset)];
  const [rows] = await connection.query(query, queryParams);

  const formattedRows = rows.map((r) => ({
    ...r,
    isAcknowledged: Boolean(r.isAcknowledged),
  }));

  return {
    alerts: formattedRows,
    total,
  };
}

async function getStats(userId = null, connection = pool) {
  const [critical] = await connection.query("SELECT COUNT(*) AS c FROM `alert` WHERE PRIORITY = 'Critical'");
  const [warning] = await connection.query("SELECT COUNT(*) AS c FROM `alert` WHERE PRIORITY = 'Warning'");
  const [info] = await connection.query("SELECT COUNT(*) AS c FROM `alert` WHERE PRIORITY = 'Info'");
  const [total] = await connection.query('SELECT COUNT(*) AS c FROM `alert`');

  let unreadQuery = `
    SELECT COUNT(*) AS c 
    FROM \`alert\` a 
    WHERE NOT EXISTS (
      SELECT 1 FROM \`alert_acknowledgement\` ak 
      WHERE ak.ALERT_ID = a.ALERT_ID ${userId ? `AND ak.USER_ID = ${Number(userId)}` : ''}
    )
  `;
  const [unread] = await connection.query(unreadQuery);

  return {
    total: Number(total[0]?.c || 0),
    critical: Number(critical[0]?.c || 0),
    warning: Number(warning[0]?.c || 0),
    info: Number(info[0]?.c || 0),
    unread: Number(unread[0]?.c || 0),
  };
}

module.exports = {
  getNextAlertId,
  createAlert,
  findById,
  findAll,
  getStats,
};
