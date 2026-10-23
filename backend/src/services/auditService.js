const auditRepository = require('../db/auditRepository');

/**
 * Audit Service
 * Centralized audit trail service for recording and retrieving operational events.
 * Security rule: Never logs passwords, JWTs, or secrets.
 */

async function recordAuditEvent({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  details = null,
}) {
  if (!action) return null;

  try {
    // Sanitize details: strip any accidental password or token strings
    let sanitizedDetails = details ? String(details) : '';
    sanitizedDetails = sanitizedDetails
      .replace(/password[:=]\s*[^\s,]+/gi, 'password: [REDACTED]')
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .substring(0, 500);

    return await auditRepository.createAuditLog({
      userId,
      action: action.toUpperCase(),
      entityType,
      entityId,
      details: sanitizedDetails,
      createdTime: new Date(),
    });
  } catch (err) {
    // Audit logging should never bring down a transaction or throw fatal error
    console.error('Audit event failed to record:', err.message);
    return null;
  }
}

async function getAuditLogs({
  userId,
  action,
  entityType,
  search,
  startDate,
  endDate,
  page = 1,
  limit = 20,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const result = await auditRepository.findAll({
    userId,
    action,
    entityType,
    search,
    startDate,
    endDate,
    limit: limitNum,
    offset,
  });

  return {
    logs: result.logs,
    total: result.total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(result.total / limitNum) || 1,
  };
}

async function getAuditLogById(id) {
  const log = await auditRepository.findById(id);
  if (!log) {
    const error = new Error(`Audit log #${id} not found.`);
    error.statusCode = 404;
    throw error;
  }
  return log;
}

module.exports = {
  recordAuditEvent,
  getAuditLogs,
  getAuditLogById,
};
