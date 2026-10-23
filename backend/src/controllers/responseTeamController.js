const responseTeamRepository = require('../db/responseTeamRepository');
const { sendSuccess } = require('../utils/response');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const getTeams = asyncHandler(async (req, res) => {
  const { availability, specialization } = req.query;
  const teams = await responseTeamRepository.findAll({ availability, specialization });
  return sendSuccess(res, { teams }, 'Response teams retrieved successfully', 200);
});

const getTeamById = asyncHandler(async (req, res) => {
  const team = await responseTeamRepository.findById(req.params.id);
  if (!team) {
    throw createError('Response team not found', 404);
  }
  return sendSuccess(res, { team }, 'Response team details retrieved', 200);
});

const updateTeamStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !['Available', 'Deployed', 'Off-duty'].includes(status)) {
    throw createError('Invalid status. Must be Available, Deployed, or Off-duty.', 400);
  }

  const team = await responseTeamRepository.findById(req.params.id);
  if (!team) {
    throw createError('Response team not found', 404);
  }

  await responseTeamRepository.updateStatus(req.params.id, status);
  const updatedTeam = await responseTeamRepository.findById(req.params.id);

  return sendSuccess(res, { team: updatedTeam }, `Team status updated to ${status}`, 200);
});

module.exports = {
  getTeams,
  getTeamById,
  updateTeamStatus,
};
