const incidentRepository = require('../db/incidentRepository');
const aiPredictionRepository = require('../db/aiPredictionRepository');
const { evaluateTriage } = require('./aiTriageService');
const { createError } = require('../middleware/errorHandler');

/**
 * Incident Service
 * Orchestrates incident creation, AI-based rule triage, prediction persistence, and status updates.
 */

async function createIncident(data, userId) {
  // 1. Evaluate Rule-Based AI Triage
  const triageResult = evaluateTriage({
    disasterType: data.disasterType,
    description: data.description,
    casualties: data.casualties,
    injuries: data.injuries,
    affectedPopulation: data.affectedPopulation,
    damageIndicators: data.damageIndicators,
  });

  // 2. Persist Incident into MySQL (table: incident)
  const incident = await incidentRepository.createIncident({
    incidentType: data.disasterType,
    severity: triageResult.severity,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    status: 'Reported',
    reportedTime: new Date(),
  });

  // 3. Persist AI Prediction into MySQL (table: ai_prediction)
  const prediction = await aiPredictionRepository.createPrediction({
    incidentId: incident.id,
    riskLevel: triageResult.riskLevel,
    confidence: triageResult.confidence,
    suggestedAction: triageResult.suggestedAction,
    predictionTime: new Date(),
  });

  // 4. Trigger Automatic Operational Alert if severity >= 7
  if (triageResult.severity >= 7) {
    const alertService = require('./alertService');
    await alertService.createSystemAlertIfNeeded('HIGH_SEVERITY_INCIDENT', {
      incidentId: incident.id,
      incidentType: data.disasterType,
      severity: triageResult.severity,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
    });
  }

  // 5. Record Audit Event
  const auditService = require('./auditService');
  await auditService.recordAuditEvent({
    userId,
    action: 'INCIDENT_CREATED',
    entityType: 'incident',
    entityId: incident.id,
    details: `Incident #${incident.id} (${data.disasterType}) reported with initial severity ${triageResult.severity}/10`,
  });

  return {
    incident,
    prediction,
    triage: {
      severity: triageResult.severity,
      confidence: triageResult.confidence,
      priority: triageResult.priority,
      riskLevel: triageResult.riskLevel,
      detectedCues: triageResult.detectedCues,
      recommendedActions: triageResult.recommendedActions,
    },
  };
}

async function getIncidents({
  search,
  status,
  severity,
  priority,
  incidentType,
  sortBy,
  page = 1,
  limit = 10,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { incidents, total } = await incidentRepository.findAll({
    search,
    status,
    severity,
    priority,
    incidentType,
    sortBy,
    limit: limitNum,
    offset,
  });

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    incidents,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
}

async function getIncidentById(id) {
  const incident = await incidentRepository.findById(id);
  if (!incident) {
    throw createError('Incident not found.', 404);
  }
  return incident;
}

async function updateIncidentStatus(id, status) {
  const existing = await incidentRepository.findById(id);
  if (!existing) {
    throw createError('Incident not found.', 404);
  }

  const updated = await incidentRepository.updateStatus(id, status);
  if (!updated) {
    throw createError('Failed to update incident status.', 500);
  }

  // If incident is resolved, automatically release all deployed response teams and generate notification
  if (status === 'Resolved') {
    const dispatchService = require('./dispatchService');
    await dispatchService.releaseTeamsForIncident(id);

    const alertService = require('./alertService');
    await alertService.createSystemAlertIfNeeded('INCIDENT_RESOLVED', {
      incidentId: id,
      incidentType: existing.incidentType,
    });
  }

  const auditService = require('./auditService');
  await auditService.recordAuditEvent({
    action: status === 'Resolved' ? 'INCIDENT_RESOLVED' : 'INCIDENT_STATUS_CHANGED',
    entityType: 'incident',
    entityId: id,
    details: `Incident #${id} status updated from "${existing.status}" to "${status}"`,
  });

  return await incidentRepository.findById(id);
}

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
};
