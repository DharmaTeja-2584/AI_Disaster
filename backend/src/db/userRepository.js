const { pool } = require('./index');

/**
 * User Repository
 * Maps directly to table: user
 * Columns: USER_ID, USER_NAME, EMAIL, PHONE, ROLE, PASSWORD
 */

/**
 * Helper to generate next ID safely within an atomic block / transaction
 */
async function getNextUserId(connection) {
  const [rows] = await connection.query('SELECT COALESCE(MAX(USER_ID), 0) + 1 AS nextId FROM `user` FOR UPDATE');
  return rows[0].nextId;
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT USER_ID AS id, USER_NAME AS name, EMAIL AS email, PHONE AS phone, ROLE AS role, PASSWORD AS password FROM `user` WHERE LOWER(EMAIL) = LOWER(?)',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT USER_ID AS id, USER_NAME AS name, EMAIL AS email, PHONE AS phone, ROLE AS role FROM `user` WHERE USER_ID = ?',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ name, email, phone = null, role = 'civilian', passwordHash }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const nextId = await getNextUserId(connection);

    await connection.execute(
      'INSERT INTO `user` (USER_ID, USER_NAME, EMAIL, PHONE, ROLE, PASSWORD) VALUES (?, ?, ?, ?, ?, ?)',
      [nextId, name, email, phone, role.toLowerCase(), passwordHash]
    );

    await connection.commit();

    return {
      id: nextId,
      name,
      email,
      phone,
      role: role.toLowerCase(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT USER_ID AS id, USER_NAME AS name, EMAIL AS email, PHONE AS phone, ROLE AS role FROM `user` ORDER BY USER_ID ASC'
  );
  return rows;
}

async function updateUserRole(id, role) {
  const [result] = await pool.execute(
    'UPDATE `user` SET ROLE = ? WHERE USER_ID = ?',
    [role.toLowerCase(), id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  findAll,
  updateUserRole,
};
