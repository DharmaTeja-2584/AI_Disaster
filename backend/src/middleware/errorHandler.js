/**
 * Global Error Handler Middleware
 *
 * Catches all errors passed via next(err) and returns a structured response.
 * Raw MySQL errors are never exposed to the client.
 */
const env = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * Async wrapper to avoid repetitive try/catch in controllers.
 * Usage: router.get('/path', asyncHandler(controller.method))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware.
 * Must be registered LAST in Express (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  // Log full error in development only
  if (env.isDev()) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
    console.error(err);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', 401);
  }

  // MySQL / database errors — sanitize before sending
  if (err.code && err.code.startsWith('ER_')) {
    if (env.isDev()) {
      return sendError(res, `Database error: ${err.sqlMessage || err.message}`, 500);
    }
    return sendError(res, 'A database error occurred. Please try again.', 500);
  }

  // Duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'A record with that value already exists.', 409);
  }

  // Custom app errors with a statusCode
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode);
  }

  // Default 500
  return sendError(
    res,
    env.isDev() ? err.message : 'Internal server error',
    err.status || 500
  );
};

/**
 * Create a structured application error.
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { errorHandler, asyncHandler, createError };
