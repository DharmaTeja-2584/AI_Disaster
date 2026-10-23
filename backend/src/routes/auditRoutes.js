const express = require('express');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// Audit logs are accessible to Commander and Admin
router.get('/audit-logs', authorize('commander', 'admin'), getAuditLogs);
router.get('/audit-logs/:id', authorize('commander', 'admin'), getAuditLogById);

module.exports = router;
