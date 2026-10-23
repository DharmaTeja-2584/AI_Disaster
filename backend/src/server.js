/**
 * Server Entry Point
 *
 * Loads the Express app, verifies MySQL connection, then starts HTTP server.
 * If the database is unreachable the server still starts but logs the warning,
 * so /api/health can report the disconnected state.
 */
require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./db');

const ASCII_BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║   AI DISASTER RESPONSE & RESOURCE ALLOCATION SYSTEM          ║
║   Backend API Server  — SQL Edition                          ║
╚═══════════════════════════════════════════════════════════════╝
`;

async function startServer() {
  console.log(ASCII_BANNER);

  // ── Verify Database Connection ──────────────────────────────────────────────
  console.log('🔌  Connecting to MySQL...');
  const dbStatus = await testConnection();

  if (dbStatus.connected) {
    console.log(`✅  Database : ${dbStatus.message}`);
  } else {
    console.warn(`⚠️   Database : ${dbStatus.message}`);
    console.warn('    The server will start, but database operations will fail.');
    console.warn('    Check your .env DB_* variables and ensure MySQL is running.');
  }

  // ── Start HTTP Server ───────────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀  Server   : http://localhost:${env.PORT}`);
    console.log(`🏥  Health   : http://localhost:${env.PORT}/api/health`);
    console.log(`🌍  Env      : ${env.NODE_ENV}`);
    console.log('─'.repeat(63));
  });

  // ── Graceful Shutdown ───────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n🛑  ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('🔴  HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
  });
}

startServer();
