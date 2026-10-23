const { pool } = require('./index');

/**
 * Shelter Repository
 * Table: shelter (SHELTER_ID, SHELTER_NAME, CAPACITY, AVAILABLE_SPACES, LOCATION)
 */

async function findAll({ search, location, availability, limit = 50, offset = 0 } = {}) {
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    whereClause += ' AND (SHELTER_NAME LIKE ? OR LOCATION LIKE ?)';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  if (location && location !== 'All') {
    whereClause += ' AND LOWER(LOCATION) LIKE LOWER(?)';
    params.push(`%${location}%`);
  }

  if (availability && availability !== 'All') {
    const availLower = availability.toLowerCase();
    if (availLower === 'full') {
      whereClause += ' AND AVAILABLE_SPACES <= 0';
    } else if (availLower === 'near capacity') {
      whereClause += ' AND (AVAILABLE_SPACES > 0 AND (AVAILABLE_SPACES / CAPACITY) <= 0.20)';
    } else if (availLower === 'available') {
      whereClause += ' AND (AVAILABLE_SPACES > 0 AND (AVAILABLE_SPACES / CAPACITY) > 0.20)';
    }
  }

  const countQuery = `SELECT COUNT(*) AS total FROM \`shelter\` ${whereClause}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  const query = `
    SELECT 
      SHELTER_ID AS id,
      SHELTER_NAME AS name,
      CAPACITY AS capacity,
      AVAILABLE_SPACES AS availableSpaces,
      LOCATION AS location,
      CASE
        WHEN AVAILABLE_SPACES <= 0 THEN 'Full'
        WHEN (AVAILABLE_SPACES / CAPACITY) <= 0.20 THEN 'Near Capacity'
        ELSE 'Available'
      END AS computedStatus
    FROM \`shelter\`
    ${whereClause}
    ORDER BY SHELTER_ID ASC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  return { shelters: rows, total };
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      SHELTER_ID AS id,
      SHELTER_NAME AS name,
      CAPACITY AS capacity,
      AVAILABLE_SPACES AS availableSpaces,
      LOCATION AS location,
      CASE
        WHEN AVAILABLE_SPACES <= 0 THEN 'Full'
        WHEN (AVAILABLE_SPACES / CAPACITY) <= 0.20 THEN 'Near Capacity'
        ELSE 'Available'
      END AS computedStatus
    FROM \`shelter\`
    WHERE SHELTER_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateAvailableSpaces(id, spaces, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `shelter` SET AVAILABLE_SPACES = ? WHERE SHELTER_ID = ?',
    [spaces, id]
  );
  return result.affectedRows > 0;
}

async function getMetrics() {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS totalShelters,
      COALESCE(SUM(CAPACITY), 0) AS totalCapacity,
      COALESCE(SUM(AVAILABLE_SPACES), 0) AS totalAvailableSpaces,
      COUNT(CASE WHEN AVAILABLE_SPACES > 0 AND (AVAILABLE_SPACES / CAPACITY) > 0.20 THEN 1 END) AS availableCount,
      COUNT(CASE WHEN AVAILABLE_SPACES > 0 AND (AVAILABLE_SPACES / CAPACITY) <= 0.20 THEN 1 END) AS nearCapacityCount,
      COUNT(CASE WHEN AVAILABLE_SPACES <= 0 THEN 1 END) AS fullCount
    FROM \`shelter\`
  `);

  const r = rows[0] || {};
  const totalCap = Number(r.totalCapacity || 0);
  const totalAvail = Number(r.totalAvailableSpaces || 0);

  return {
    totalShelters: Number(r.totalShelters || 0),
    totalCapacity: totalCap,
    availableSpaces: totalAvail,
    occupiedSpaces: Math.max(0, totalCap - totalAvail),
    availableCount: Number(r.availableCount || 0),
    nearCapacityCount: Number(r.nearCapacityCount || 0),
    fullCount: Number(r.fullCount || 0),
  };
}

module.exports = {
  findAll,
  findById,
  updateAvailableSpaces,
  getMetrics,
};
