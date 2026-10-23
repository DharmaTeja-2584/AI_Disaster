/**
 * Environment Configuration
 * Centralizes and validates all environment variables.
 * All config must be sourced from here — never from process.env directly.
 */
require('dotenv').config();

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'ai_disaster_db',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Helpers
  isDev: () => env.NODE_ENV === 'development',
  isProd: () => env.NODE_ENV === 'production',
};

module.exports = env;
