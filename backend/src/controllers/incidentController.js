const incidentService = require('../services/incidentService');
const { createIncidentSchema, updateStatusSchema } = require('../validators/incidentValidators');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const createIncident = asyncHandler(async (req, res) => {
  const validated = createIncidentSchema.parse(req.body);
  const result = await incidentService.createIncident(validated, req.user?.id);
  return sendSuccess(res, result, 'Incident reported and triaged successfully', 201);
});

const getIncidents = asyncHandler(async (req, res) => {
  const { search, status, severity, priority, incidentType, sortBy, page, limit } = req.query;
  const result = await incidentService.getIncidents({
    search,
    status,
    severity,
    priority,
    incidentType,
    sortBy,
    page,
    limit,
  });
  return sendSuccess(res, result, 'Incidents retrieved successfully', 200);
});

const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncidentById(req.params.id);
  return sendSuccess(res, { incident }, 'Incident details retrieved successfully', 200);
});

const updateIncidentStatus = asyncHandler(async (req, res) => {
  const validated = updateStatusSchema.parse(req.body);
  const incident = await incidentService.updateIncidentStatus(req.params.id, validated.status);
  return sendSuccess(res, { incident }, 'Incident status updated successfully', 200);
});

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
};
