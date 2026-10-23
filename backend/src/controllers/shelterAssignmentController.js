const shelterService = require('../services/shelterService');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getCandidates = asyncHandler(async (req, res) => {
  const result = await shelterService.getCandidateShelters(req.params.id);
  return sendSuccess(res, result, 'Candidate evacuation shelters retrieved', 200);
});

const assignShelter = asyncHandler(async (req, res) => {
  const { shelterId, assignedSpaces } = req.body;
  const result = await shelterService.assignShelter(req.params.id, {
    shelterId: Number(shelterId),
    assignedSpaces: Number(assignedSpaces),
  });
  return sendSuccess(res, result, 'Evacuation shelter assigned successfully', 200);
});

const releaseAssignment = asyncHandler(async (req, res) => {
  const result = await shelterService.releaseShelterAssignment(req.params.id);
  return sendSuccess(res, result, 'Shelter assignment released successfully', 200);
});

module.exports = {
  getCandidates,
  assignShelter,
  releaseAssignment,
};
