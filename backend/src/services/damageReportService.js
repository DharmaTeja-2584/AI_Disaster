const damageReportRepository = require('../db/damageReportRepository');
const aiPredictionRepository = require('../db/aiPredictionRepository');
const incidentRepository = require('../db/incidentRepository');
const { evaluateSecondaryTriage } = require('./aiTriageService');
const alertService = require('./alertService');
const { pool } = require('../db');

/**
 * Damage Report Service
 * Manages field damage assessments, transactional linking to incidents,
 * secondary AI triage re-evaluation, and severity escalation alerts.
 */

const VALID_DAMAGE_LEVELS = ['Minor', 'Moderate', 'Severe', 'Critical'];

async function createDamageReport({
  incidentId,
  damageLevel,
  estimatedLoss = 0,
  description,
  photo = null,
  reportedByUserId = null,
}) {
  if (!incidentId) {
    const error = new Error('Incident ID is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!description || !description.trim()) {
    const error = new Error('Damage assessment description is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedLevel = VALID_DAMAGE_LEVELS.includes(damageLevel) ? damageLevel : 'Moderate';
  const numericLoss = Math.max(0, parseFloat(estimatedLoss) || 0);

  // 1. Verify incident exists
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    const error = new Error(`Incident #${incidentId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Persist damage report and junction record transactionally
  const connection = await pool.getConnection();
  let createdReport;
  try {
    await connection.beginTransaction();

    createdReport = await damageReportRepository.createDamageReport(
      {
        incidentId: Number(incidentId),
        damageLevel: normalizedLevel,
        estimatedLoss: numericLoss,
        description: description.trim().substring(0, 255),
        photo: photo ? String(photo).substring(0, 255) : null,
      },
      connection
    );

    await connection.commit();

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      userId: reportedByUserId,
      action: 'DAMAGE_REPORT_SUBMITTED',
      entityType: 'damage_report',
      entityId: createdReport.reportId,
      details: `${normalizedLevel} damage reported for Incident #${incidentId} (Est Loss: $${numericLoss.toLocaleString()})`,
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  // 3. Secondary AI Triage
  // Retrieve all damage reports for this incident to provide complete field context
  const allDamageReports = await damageReportRepository.findByIncidentId(incidentId);

  const reassessment = evaluateSecondaryTriage({
    incident,
    damageReports: allDamageReports,
    latestReport: createdReport,
  });

  // 4. Persist secondary AI prediction as a NEW record (preserving historical predictions!)
  let newPrediction = null;
  try {
    newPrediction = await aiPredictionRepository.createPrediction({
      incidentId: Number(incidentId),
      riskLevel: reassessment.riskLevel,
      confidence: reassessment.confidence,
      suggestedAction: reassessment.suggestedAction,
      predictionTime: new Date(),
    });
  } catch (pErr) {
    console.error('Failed to save secondary AI prediction:', pErr.message);
  }

  // 5. Severity Escalation Handling
  let escalationAlert = null;
  if (reassessment.isEscalated) {
    // Update incident severity in MySQL
    await pool.execute(
      'UPDATE `incident` SET SEVERITY = ? WHERE INCIDENT_ID = ?',
      [String(reassessment.severity), Number(incidentId)]
    );

    // Create Critical Escalation Alert
    escalationAlert = await alertService.createSystemAlertIfNeeded('AI_SEVERITY_ESCALATION', {
      incidentId: Number(incidentId),
      previousSeverity: reassessment.previousSeverity,
      newSeverity: reassessment.severity,
    });
  }

  return {
    damageReport: createdReport,
    secondaryTriage: {
      ...reassessment,
      predictionId: newPrediction?.id || null,
    },
    escalated: reassessment.isEscalated,
    escalationAlert: escalationAlert || null,
  };
}

async function getIncidentDamageReports(incidentId) {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    const error = new Error(`Incident #${incidentId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  return await damageReportRepository.findByIncidentId(incidentId);
}

async function getDamageReportById(id) {
  const report = await damageReportRepository.findById(id);
  if (!report) {
    const error = new Error(`Damage report #${id} not found.`);
    error.statusCode = 404;
    throw error;
  }
  return report;
}

async function getDamageReports({ damageLevel, search, page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const result = await damageReportRepository.findAll({
    damageLevel,
    search,
    limit: limitNum,
    offset,
  });

  return {
    damageReports: result.damageReports,
    total: result.total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(result.total / limitNum) || 1,
  };
}

module.exports = {
  createDamageReport,
  getIncidentDamageReports,
  getDamageReportById,
  getDamageReports,
};
