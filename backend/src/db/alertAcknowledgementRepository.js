const { pool } = require('./index');

/**
 * Alert Acknowledgement Repository
 * Table: alert_acknowledgement
 * Columns: ACKNOWLEDGEMENT_ID, ALERT_ID, USER_ID, ACKNOWLEDGED_TIME
 */

async function getNextAcknowledgementId(connection = pool) {
  const [rows] = await connection.query(
    'SELECT COALESCE(MAX(ACKNOWLEDGEMENT_ID), 0) + 1 AS nextId FROM `alert_acknowledgement` FOR UPDATE'
  );
  return rows[0].nextId;
}

async function createAcknowledgement(
  { alertId, userId, acknowledgedTime = new Date() },
  connection = pool
) {
  const nextId = await getNextAcknowledgementId(connection);

  await connection.execute(
    'INSERT INTO `alert_acknowledgement` (ACKNOWLEDGEMENT_ID, ALERT_ID, USER_ID, ACKNOWLEDGED_TIME) VALUES (?, ?, ?, ?)',
    [nextId, alertId, userId, acknowledgedTime]
  );

  return {
    acknowledgementId: nextId,
    alertId,
    userId,
    acknowledgedTime,
  };
}

async function findByAlertAndUser(alertId, userId, connection = pool) {
  const [rows] = await connection.execute(
    'SELECT ACKNOWLEDGEMENT_ID AS acknowledgementId, ALERT_ID AS alertId, USER_ID AS userId, ACKNOWLEDGED_TIME AS acknowledgedTime FROM `alert_acknowledgement` WHERE ALERT_ID = ? AND USER_ID = ?',
    [alertId, userId]
  );
  return rows[0] || null;
}

async function findByAlertId(alertId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      ak.ACKNOWLEDGEMENT_ID AS acknowledgementId, 
      ak.ALERT_ID AS alertId, 
      ak.USER_ID AS userId, 
      ak.ACKNOWLEDGED_TIME AS acknowledgedTime,
      u.USER_NAME AS userName,
      u.ROLE AS userRole
    FROM \`alert_acknowledgement\` ak
    LEFT JOIN \`user\` u ON ak.USER_ID = u.USER_ID
    WHERE ak.ALERT_ID = ?
    ORDER BY ak.ACKNOWLEDGED_TIME ASC`,
    [alertId]
  );
  return rows;
}

module.exports = {
  getNextAcknowledgementId,
  createAcknowledgement,
  findByAlertAndUser,
  findByAlertId,
};
