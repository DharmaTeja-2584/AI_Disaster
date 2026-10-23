const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Invalid email address').max(100, 'Email must not exceed 100 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must not exceed 100 characters'),
  phone: z.string().max(15, 'Phone number must not exceed 15 characters').optional().nullable(),
  role: z.enum(['civilian', 'responder', 'commander', 'admin']).optional().default('civilian'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
