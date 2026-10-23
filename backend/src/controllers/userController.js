const bcrypt = require('bcryptjs');
const userRepository = require('../db/userRepository');
const { recordAuditEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_ROLES = ['civilian', 'responder', 'commander', 'admin'];

/**
 * GET /api/users
 * Returns list of all users (Admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await userRepository.findAll();
  return sendSuccess(res, users, 'Users retrieved successfully.');
});

/**
 * GET /api/users/:id
 * Returns a specific user (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) {
    return sendError(res, 'User not found.', 404);
  }
  return sendSuccess(res, user, 'User details retrieved.');
});

/**
 * POST /api/users
 * Admin creates a new user with assigned role
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  if (!name || !email || !password || !role) {
    return sendError(res, 'Name, email, password, and role are required.', 400);
  }

  const normalizedRole = role.toLowerCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    return sendError(res, `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`, 400);
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return sendError(res, 'A user with this email address already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await userRepository.createUser({
    name,
    email,
    phone: phone || null,
    role: normalizedRole,
    passwordHash,
  });

  await recordAuditEvent({
    userId: req.user?.id,
    action: 'USER_CREATED',
    entityType: 'user',
    entityId: newUser.id,
    details: `User "${name}" (${email}) created with role "${normalizedRole}" by Admin`,
  });

  return sendSuccess(res, newUser, 'User created successfully.', 201);
});

/**
 * PATCH /api/users/:id/role
 * Admin updates a user's role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const targetId = parseInt(req.params.id, 10);

  if (!role) {
    return sendError(res, 'Role is required.', 400);
  }

  const normalizedRole = role.toLowerCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    return sendError(res, `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`, 400);
  }

  const targetUser = await userRepository.findById(targetId);
  if (!targetUser) {
    return sendError(res, 'User not found.', 404);
  }

  const success = await userRepository.updateUserRole(targetId, normalizedRole);
  if (!success) {
    return sendError(res, 'Failed to update user role.', 500);
  }

  await recordAuditEvent({
    userId: req.user?.id,
    action: 'USER_ROLE_UPDATED',
    entityType: 'user',
    entityId: targetId,
    details: `User #${targetId} (${targetUser.email}) role changed from "${targetUser.role}" to "${normalizedRole}"`,
  });

  const updatedUser = await userRepository.findById(targetId);
  return sendSuccess(res, updatedUser, 'User role updated successfully.');
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUserRole,
};
