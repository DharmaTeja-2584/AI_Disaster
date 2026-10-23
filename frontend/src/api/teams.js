import client from './client';

export const getResponseTeams = (params) => client.get('/response-teams', { params });

export const getResponseTeamById = (id) => client.get(`/response-teams/${id}`);

export const updateResponseTeamStatus = (id, status) =>
  client.patch(`/response-teams/${id}/status`, { status });

export const getCandidateTeams = (incidentId) =>
  client.get(`/incidents/${incidentId}/candidate-teams`);

export const allocateTeam = (incidentId, teamId) =>
  client.post(`/incidents/${incidentId}/allocate-team`, { teamId });
