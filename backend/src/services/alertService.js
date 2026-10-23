const alertRepository = require('../db/alertRepository');
const incidentAlertRepository = require('../db/incidentAlertRepository');
const alertAckRepository = require('../db/alertAcknowledgementRepository');
const { pool } = require('../db');

/**
 * Alert Service
 * Manages operational alerts, incident links, multi-user acknowledgements,
 * and automated system warnings.
 */

async function createAlert({ title, message, priority = 'Info', incidentId = null, userId = null }) {
  if (!title || !message) {
    const error = new Error('Alert title and message are required.');
    error.statusCode = 400;
    throw error;
  }

  const validPriorities = ['Critical', 'Warning', 'Info'];
  const normalizedPriority = validPriorities.includes(priority) ? priority : 'Info';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const alert = await alertRepository.createAlert(
      {
        title: title.trim().substring(0, 150),
        message: message.trim().substring(0, 255),
        priority: normalizedPriority,
        alertTime: new Date(),
      },
      connection
    );

    let incidentLink = null;
    if (incidentId) {
      incidentLink = await incidentAlertRepository.createIncidentAlert(
        {
          incidentId: Number(incidentId),
          alertId: alert.alertId,
        },
        connection
      );
    }

    await connection.commit();

    const auditService = require('./auditService');
    await auditService.recordAuditEvent({
      userId,
      action: 'ALERT_CREATED',
      entityType: 'alert',
      entityId: alert.alertId,
      details: `[${normalizedPriority}] ${alert.title}${incidentId ? ` (Linked to Incident #${incidentId})` : ''}`,
    });

    return {
      ...alert,
      incidentId: incidentId ? Number(incidentId) : null,
      incidentAlertId: incidentLink?.incidentAlertId || null,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getAlerts({
  search,
  priority,
  acknowledged,
  incidentId,
  page = 1,
  limit = 20,
  userId = null,
  role = null,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // Role-based visibility adjustment
  // Civilians see public emergency alerts (all active broadcasts)
  const result = await alertRepository.findAll({
    search,
    priority,
    acknowledged,
    incidentId: incidentId ? Number(incidentId) : undefined,
    limit: limitNum,
    offset,
    userId,
  });

  const stats = await alertRepository.getStats(userId);

  return {
    alerts: result.alerts,
    total: result.total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(result.total / limitNum) || 1,
    stats,
  };
}

async function getAlertById(id, userId = null) {
  const alert = await alertRepository.findById(id, userId);
  if (!alert) {
    const error = new Error(`Alert #${id} not found.`);
    error.statusCode = 404;
    throw error;
  }
  return alert;
}

async function getIncidentAlerts(incidentId) {
  return await incidentAlertRepository.findByIncidentId(incidentId);
}

async function acknowledgeAlert(alertId, userId) {
  if (!alertId || !userId) {
    const error = new Error('Alert ID and User ID are required for acknowledgement.');
    error.statusCode = 400;
    throw error;
  }

  const alert = await alertRepository.findById(alertId);
  if (!alert) {
    const error = new Error(`Alert #${alertId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  // Check if already acknowledged by this user
  const existing = await alertAckRepository.findByAlertAndUser(alertId, userId);
  if (existing) {
    return {
      acknowledged: true,
      alreadyAcknowledged: true,
      acknowledgementId: existing.acknowledgementId,
      acknowledgedTime: existing.acknowledgedTime,
      alertId,
      userId,
    };
  }

  const ack = await alertAckRepository.createAcknowledgement({
    alertId: Number(alertId),
    userId: Number(userId),
    acknowledgedTime: new Date(),
  });

  const auditService = require('./auditService');
  await auditService.recordAuditEvent({
    userId,
    action: 'ALERT_ACKNOWLEDGED',
    entityType: 'alert',
    entityId: Number(alertId),
    details: `Alert #${alertId} acknowledged by user #${userId}`,
  });

  return {
    acknowledged: true,
    alreadyAcknowledged: false,
    acknowledgementId: ack.acknowledgementId,
    acknowledgedTime: ack.acknowledgedTime,
    alertId,
    userId,
  };
}

/**
 * Creates automatic system alerts for key operational events
 * with deduplication protection.
 */
async function createSystemAlertIfNeeded(type, data = {}) {
  try {
    let title = '';
    let message = '';
    let priority = 'Info';
    let incidentId = data.incidentId || null;

    switch (type) {
      case 'HIGH_SEVERITY_INCIDENT': {
        const sev = Number(data.severity || 7);
        priority = sev >= 8 ? 'Critical' : 'Warning';
        title = `CRITICAL INCIDENT: ${data.incidentType || 'Emergency'} (Severity ${sev}/10)`;
        message = `High priority incident reported at coordinates (${data.latitude || '0.00'}, ${data.longitude || '0.00'}). ${(data.description || '').substring(0, 150)}`;
        break;
      }

      case 'RESOURCE_LOW_STOCK': {
        priority = 'Warning';
        title = `RESOURCE WARNING: Low Stock — ${data.resourceName}`;
        message = `Inventory for ${data.resourceName} decreased to ${data.quantity} units at ${data.location}. Restocking advised.`;
        break;
      }

      case 'RESOURCE_DEPLETED': {
        priority = 'Critical';
        title = `CRITICAL SHORTAGE: ${data.resourceName} Depleted`;
        message = `Operational inventory for ${data.resourceName} has reached 0 units. Immediate supply transfer required.`;
        break;
      }

      case 'SHELTER_NEAR_CAPACITY': {
        priority = 'Warning';
        title = `SHELTER ADVISORY: ${data.shelterName} Near Capacity`;
        message = `Available reception capacity down to ${data.availableSpaces}/${data.capacity} spaces at ${data.location}.`;
        break;
      }

      case 'SHELTER_FULL': {
        priority = 'Critical';
        title = `CRITICAL: ${data.shelterName} At Maximum Capacity`;
        message = `Shelter ${data.shelterName} has 0 available spaces left. Reroute evacuees to adjacent facilities immediately.`;
        break;
      }

      case 'INCIDENT_RESOLVED': {
        priority = 'Info';
        title = `INCIDENT RESOLVED: #${incidentId} ${data.incidentType || ''}`;
        message = `Incident #${incidentId} has been successfully contained and resolved by Incident Command.`;
        break;
      }

      case 'AI_SEVERITY_ESCALATION': {
        priority = 'Critical';
        title = `CRITICAL: Incident #${incidentId} Severity Escalated`;
        message = `Incident #${incidentId} reassessed from Severity ${data.previousSeverity} to ${data.newSeverity} based on on-scene field damage assessment.`;
        break;
      }

      default:
        return null;
    }

    // Deduplication check: check if an alert with this exact title was created in the last 10 minutes
    const [existing] = await pool.execute(
      'SELECT ALERT_ID FROM `alert` WHERE TITLE = ? AND ALERT_TIME >= DATE_SUB(NOW(), INTERVAL 10 MINUTE) LIMIT 1',
      [title.substring(0, 150)]
    );

    if (existing.length > 0) {
      return null; // Suppress duplicate
    }

    return await createAlert({
      title,
      message,
      priority,
      incidentId,
    });
  } catch (err) {
    console.error('Failed to create system alert:', err.message);
    return null;
  }
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  getIncidentAlerts,
  acknowledgeAlert,
  createSystemAlertIfNeeded,
};
