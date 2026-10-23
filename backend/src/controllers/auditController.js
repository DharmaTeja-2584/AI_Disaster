const auditService = require('../services/auditService');
const { sendSuccess } = require('../utils/response');

async function getAuditLogs(req, res, next) {
  try {
    const data = await auditService.getAuditLogs(req.query);
    return sendSuccess(res, data, 'Audit logs retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getAuditLogById(req, res, next) {
  try {
    const log = await auditService.getAuditLogById(req.params.id);
    return sendSuccess(res, log, 'Audit log retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
