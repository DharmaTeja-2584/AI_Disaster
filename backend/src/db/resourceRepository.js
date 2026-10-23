const { pool } = require('./index');

/**
 * Resource Repository
 * Table: resource (RESOURCE_ID, RESOURCE_NAME, CATEGORY, QUANTITY, AVAILABILITY, LOCATION)
 */

async function findAll({
  search,
  category,
  availability,
  location,
  limit = 50,
  offset = 0,
  sortBy = 'id_asc',
} = {}) {
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    whereClause += ' AND (RESOURCE_NAME LIKE ? OR CATEGORY LIKE ? OR LOCATION LIKE ?)';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  if (category && category !== 'All') {
    whereClause += ' AND LOWER(CATEGORY) = LOWER(?)';
    params.push(category);
  }

  if (location && location !== 'All') {
    whereClause += ' AND LOWER(LOCATION) LIKE LOWER(?)';
    params.push(`%${location}%`);
  }

  if (availability && availability !== 'All') {
    const availLower = availability.toLowerCase();
    if (availLower === 'available') {
      whereClause += " AND (LOWER(AVAILABILITY) = 'available' AND QUANTITY > 20)";
    } else if (availLower === 'low stock') {
      whereClause += " AND ((LOWER(AVAILABILITY) = 'low stock' OR (QUANTITY > 0 AND QUANTITY <= 20)) AND LOWER(AVAILABILITY) != 'unavailable')";
    } else if (availLower === 'depleted') {
      whereClause += " AND (LOWER(AVAILABILITY) = 'depleted' OR QUANTITY = 0)";
    } else if (availLower === 'unavailable') {
      whereClause += " AND LOWER(AVAILABILITY) = 'unavailable'";
    } else {
      whereClause += ' AND LOWER(AVAILABILITY) = LOWER(?)';
      params.push(availability);
    }
  }

  // Count total matching
  const countQuery = `SELECT COUNT(*) AS total FROM \`resource\` ${whereClause}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = Number(countRows[0]?.total || 0);

  let orderClause = ' ORDER BY RESOURCE_ID ASC';
  if (sortBy === 'quantity_desc') {
    orderClause = ' ORDER BY QUANTITY DESC';
  } else if (sortBy === 'quantity_asc') {
    orderClause = ' ORDER BY QUANTITY ASC';
  } else if (sortBy === 'name_asc') {
    orderClause = ' ORDER BY RESOURCE_NAME ASC';
  }

  const query = `
    SELECT 
      RESOURCE_ID AS id,
      RESOURCE_NAME AS name,
      CATEGORY AS category,
      QUANTITY AS quantity,
      AVAILABILITY AS availability,
      LOCATION AS location,
      CASE 
        WHEN LOWER(AVAILABILITY) = 'unavailable' THEN 'Unavailable'
        WHEN QUANTITY <= 0 THEN 'Depleted'
        WHEN QUANTITY <= 20 THEN 'Low Stock'
        ELSE 'Available'
      END AS computedStatus
    FROM \`resource\`
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  return { resources: rows, total };
}

async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT 
      RESOURCE_ID AS id,
      RESOURCE_NAME AS name,
      CATEGORY AS category,
      QUANTITY AS quantity,
      AVAILABILITY AS availability,
      LOCATION AS location,
      CASE 
        WHEN LOWER(AVAILABILITY) = 'unavailable' THEN 'Unavailable'
        WHEN QUANTITY <= 0 THEN 'Depleted'
        WHEN QUANTITY <= 20 THEN 'Low Stock'
        ELSE 'Available'
      END AS computedStatus
    FROM \`resource\`
    WHERE RESOURCE_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateStatus(id, status, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `resource` SET AVAILABILITY = ? WHERE RESOURCE_ID = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

async function updateQuantityAndAvailability(id, quantity, availability, connection = pool) {
  const [result] = await connection.execute(
    'UPDATE `resource` SET QUANTITY = ?, AVAILABILITY = ? WHERE RESOURCE_ID = ?',
    [quantity, availability, id]
  );
  return result.affectedRows > 0;
}

async function getMetrics() {
  const [counts] = await pool.query(`
    SELECT
      COUNT(*) AS totalTypes,
      COALESCE(SUM(QUANTITY), 0) AS totalQuantity,
      COUNT(CASE WHEN LOWER(AVAILABILITY) != 'unavailable' AND QUANTITY > 20 THEN 1 END) AS availableCount,
      COUNT(CASE WHEN (LOWER(AVAILABILITY) = 'low stock' OR (QUANTITY > 0 AND QUANTITY <= 20)) AND LOWER(AVAILABILITY) != 'unavailable' THEN 1 END) AS lowStockCount,
      COUNT(CASE WHEN LOWER(AVAILABILITY) = 'depleted' OR QUANTITY = 0 THEN 1 END) AS depletedCount,
      COUNT(CASE WHEN LOWER(AVAILABILITY) = 'unavailable' THEN 1 END) AS unavailableCount
    FROM \`resource\`
  `);

  const [allocations] = await pool.query(`
    SELECT COALESCE(SUM(QUANTITY), 0) AS totalAllocated
    FROM \`resource_allocation\`
    WHERE STATUS = 'Allocated'
  `);

  const c = counts[0] || {};
  const a = allocations[0] || {};

  return {
    totalTypes: Number(c.totalTypes || 0),
    totalQuantity: Number(c.totalQuantity || 0),
    availableCount: Number(c.availableCount || 0),
    lowStockCount: Number(c.lowStockCount || 0),
    depletedCount: Number(c.depletedCount || 0),
    unavailableCount: Number(c.unavailableCount || 0),
    totalAllocated: Number(a.totalAllocated || 0),
  };
}

module.exports = {
  findAll,
  findById,
  updateStatus,
  updateQuantityAndAvailability,
  getMetrics,
};
