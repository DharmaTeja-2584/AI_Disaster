/**
 * MySQL Database Configuration
 *
 * Creates and exports a reusable mysql2/promise connection pool.
 * All database access must go through this pool — never open raw connections.
 *
 * Architecture:
 *   Route → Controller → Service → Repository → pool (here) → MySQL
 *
 * NOTE: No SQL schemas or tables are created here.
 *       The exact table definitions will be supplied separately and
 *       applied via migration scripts. This file only manages the connection.
 */
const mysql = require('mysql2/promise');
const env = require('./env');

// Connection pool configuration
const poolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  // Pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Always return dates as JS Date objects
  dateStrings: false,

  // Timezone
  timezone: '+00:00',
};

// Create the connection pool
const pool = mysql.createPool(poolConfig);

/**
 * testConnection
 * Attempts to acquire one connection from the pool and release it.
 * Used by the health-check endpoint and server startup.
 *
 * @returns {Promise<{ connected: boolean, message: string }>}
 */
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    return { connected: true, message: 'MySQL connection successful' };
  } catch (error) {
    return {
      connected: false,
      message: `MySQL connection failed: ${error.message}`,
    };
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { pool, testConnection };
