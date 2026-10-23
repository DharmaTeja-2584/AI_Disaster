const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const validated = registerSchema.parse(req.body);
  const result = await authService.register(validated);
  return sendSuccess(res, result, 'Registration successful', 201);
});

const login = asyncHandler(async (req, res) => {
  const validated = loginSchema.parse(req.body);
  const result = await authService.login(validated);
  return sendSuccess(res, result, 'Login successful', 200);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, { user }, 'User profile retrieved', 200);
});

module.exports = {
  register,
  login,
  getMe,
};
