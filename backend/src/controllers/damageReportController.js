const damageReportService = require('../services/damageReportService');
const { sendSuccess } = require('../utils/response');

async function createDamageReport(req, res, next) {
  try {
    const incidentId = req.params.id;
    const result = await damageReportService.createDamageReport({
      incidentId,
      ...req.body,
      reportedByUserId: req.user?.id,
    });
    return sendSuccess(res, result, 'Field damage report submitted successfully.', 201);
  } catch (error) {
    next(error);
  }
}

async function getIncidentDamageReports(req, res, next) {
  try {
    const reports = await damageReportService.getIncidentDamageReports(req.params.id);
    return sendSuccess(res, reports, 'Incident damage reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getDamageReportById(req, res, next) {
  try {
    const report = await damageReportService.getDamageReportById(req.params.id);
    return sendSuccess(res, report, 'Damage report retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

async function getDamageReports(req, res, next) {
  try {
    const data = await damageReportService.getDamageReports(req.query);
    return sendSuccess(res, data, 'Damage reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDamageReport,
  getIncidentDamageReports,
  getDamageReportById,
  getDamageReports,
};
