const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../db/userRepository');
const env = require('../config/env');
const { createError } = require('../middleware/errorHandler');

/**
 * Generate signed JWT
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Register a new user
 */
async function register({ name, email, password, phone = null, role = 'civilian' }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw createError('An account with this email address already exists.', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await userRepository.createUser({
    name,
    email,
    phone,
    role,
    passwordHash,
  });

  const auditService = require('./auditService');
  await auditService.recordAuditEvent({
    userId: newUser.id,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: newUser.id,
    details: `User ${newUser.name} registered with role ${newUser.role}`,
  });

  const token = generateToken(newUser);

  return {
    user: newUser,
    token,
  };
}

/**
 * Login an existing user
 */
async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw createError('Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError('Invalid email or password.', 401);
  }

  const sanitizedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  const auditService = require('./auditService');
  await auditService.recordAuditEvent({
    userId: sanitizedUser.id,
    action: 'USER_LOGIN',
    entityType: 'user',
    entityId: sanitizedUser.id,
    details: `User ${sanitizedUser.email} (${sanitizedUser.role}) authenticated successfully`,
  });

  const token = generateToken(sanitizedUser);

  return {
    user: sanitizedUser,
    token,
  };
}

/**
 * Get current authenticated user by ID
 */
async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw createError('User not found.', 404);
  }
  return user;
}

module.exports = {
  register,
  login,
  getMe,
};
