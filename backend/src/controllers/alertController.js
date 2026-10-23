const alertService = require('../services/alertService');
const { sendSuccess, sendError } = require('../utils/response');

async function createAlert(req, res, next) {
  try {
    const alert = await alertService.createAlert({
      ...req.body,
      userId: req.user?.id,
    });
    return sendSuccess(res, alert, 'Alert created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

async function getAlerts(req, res, next) {
  try {
    const data = await alertService.getAlerts({
      ...req.query,
      userId: req.user?.id,
      role: req.user?.role,
    });
    return sendSuccess(res, data, 'Alerts retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getAlertById(req, res, next) {
  try {
    const alert = await alertService.getAlertById(req.params.id, req.user?.id);
    return sendSuccess(res, alert, 'Alert retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function acknowledgeAlert(req, res, next) {
  try {
    const result = await alertService.acknowledgeAlert(req.params.id, req.user?.id);
    return sendSuccess(res, result, 'Alert acknowledged successfully.');
  } catch (error) {
    next(error);
  }
}

async function getIncidentAlerts(req, res, next) {
  try {
    const alerts = await alertService.getIncidentAlerts(req.params.id);
    return sendSuccess(res, alerts, 'Incident alerts retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function createIncidentAlert(req, res, next) {
  try {
    const alert = await alertService.createAlert({
      ...req.body,
      incidentId: req.params.id,
      userId: req.user?.id,
    });
    return sendSuccess(res, alert, 'Incident alert created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  getIncidentAlerts,
  createIncidentAlert,
};
