const dispatchService = require('../services/dispatchService');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getCandidates = asyncHandler(async (req, res) => {
  const result = await dispatchService.getCandidateTeams(req.params.id);
  return sendSuccess(res, result, 'Candidate dispatch response teams retrieved', 200);
});

const allocateTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.body;
  const result = await dispatchService.allocateTeam(req.params.id, teamId ? Number(teamId) : null);
  return sendSuccess(res, result, 'Response team allocated and deployed successfully', 200);
});

module.exports = {
  getCandidates,
  allocateTeam,
};
