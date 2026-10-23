/**
 * Express Application Factory
 *
 * Registers all middleware and routes.
 * Does NOT start the server (that is server.js).
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');

// ─── Route Imports ────────────────────────────────────────────────────────────
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const responseTeamRoutes = require('./routes/responseTeamRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const alertRoutes = require('./routes/alertRoutes');
const damageReportRoutes = require('./routes/damageReportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const userRoutes = require('./routes/userRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.isDev() ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Request Logger ───────────────────────────────────────────────────────────
if (env.isDev()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.isDev() ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => env.isDev() && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  },
});
app.use('/api', limiter);

// ─── Root Route ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'AI Disaster Response & Resource Allocation System — Backend API',
    status: 'online',
    healthCheck: '/api/health',
    frontendUrl: 'http://localhost:5174',
    endpoints: {
      auth: '/api/auth',
      incidents: '/api/incidents',
      dashboard: '/api/dashboard/metrics',
      responseTeams: '/api/response-teams',
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/response-teams', responseTeamRoutes);
app.use('/api', dispatchRoutes);
app.use('/api', resourceRoutes);
app.use('/api', shelterRoutes);
app.use('/api', alertRoutes);
app.use('/api', damageReportRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', auditRoutes);
app.use('/api', userRoutes);
app.use('/api', demoRoutes);

// Phase 4+: Additional routes added here as operational features are built

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
