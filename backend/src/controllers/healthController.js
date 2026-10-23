/**
 * Health Check Controller
 *
 * GET /api/health
 * Returns current API + MySQL database status.
 * Used for startup verification and monitoring.
 */
const { testConnection } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

const healthCheck = asyncHandler(async (req, res) => {
  const dbStatus = await testConnection();

  const status = {
    success: dbStatus.connected,
    api: 'healthy',
    database: dbStatus.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  if (!dbStatus.connected) {
    status.databaseMessage = dbStatus.message;
  }

  return res.status(dbStatus.connected ? 200 : 503).json(status);
});

module.exports = { healthCheck };
