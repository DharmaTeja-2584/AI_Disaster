/**
 * Authorization Middleware
 *
 * Role-based access control.
 * Must be used AFTER authenticate middleware.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('admin'), controller)
 *   router.get('/ops', authenticate, authorize('commander', 'admin'), controller)
 */
const { sendError } = require('../utils/response');

/**
 * authorize
 * Returns middleware that allows only users with the specified roles.
 *
 * @param {...string} allowedRoles - One or more allowed role strings
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return sendError(
        res,
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403
      );
    }

    next();
  };
};

/**
 * Role constants — use these throughout the app for consistency.
 */
const ROLES = {
  CIVILIAN: 'civilian',
  RESPONDER: 'responder',
  COMMANDER: 'commander',
  ADMIN: 'admin',
};

module.exports = { authorize, ROLES };
