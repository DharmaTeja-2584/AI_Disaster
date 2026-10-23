/**
 * Database Access Layer — Entry Point
 *
 * This is the single entry point for all database operations.
 *
 * Architecture:
 *   Route
 *    ↓
 *   Controller
 *    ↓
 *   Service
 *    ↓
 *   Repository  ← (imported here and exported for use by all repositories)
 *    ↓
 *   pool (mysql2/promise)
 *    ↓
 *   MySQL
 *
 * Repository files are created per-entity as the SQL schemas are provided.
 * IMPORTANT: No SQL queries are written here. Only the pool is re-exported.
 * Each entity will have its own repository file in /src/db/:
 *
 *   userRepository.js        ← User entity
 *   incidentRepository.js    ← Incident entity
 *   aiPredictionRepository.js ← AIPrediction entity
 *   teamRepository.js        ← ResponseTeam entity
 *   resourceRepository.js    ← Resource entity
 *   resourceAllocationRepository.js ← ResourceAllocation entity
 *   shelterRepository.js     ← Shelter entity
 *   alertRepository.js       ← Alert entity
 *   damageReportRepository.js ← DamageReport entity
 *   volunteerRepository.js   ← Volunteer entity
 *   dashboardRepository.js   ← Aggregate/reporting queries
 *   analyticsRepository.js   ← Analytics queries
 *
 * NOTE: Repositories are added ONLY after the SQL schemas are supplied.
 */
const { pool, testConnection } = require('../config/database');

module.exports = { pool, testConnection };
