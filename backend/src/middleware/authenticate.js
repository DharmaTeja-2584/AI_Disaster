/**
 * Authentication Middleware
 *
 * Verifies the JWT token from the Authorization header.
 * Attaches decoded user payload to req.user.
 *
 * Full implementation is in Phase 2. This stub is ready for it.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * authenticate
 * Protects routes by verifying the JWT Bearer token.
 * Sets req.user = { id, role, email, ... } on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. Please provide a valid token.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Your session has expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

module.exports = { authenticate };
