import client from './client';

export const getShelters = (params) => client.get('/shelters', { params });

export const getShelterById = (id) => client.get(`/shelters/${id}`);

export const getShelterMetrics = () => client.get('/shelters/metrics');

export const getCandidateShelters = (incidentId) =>
  client.get(`/incidents/${incidentId}/candidate-shelters`);

export const assignShelter = (incidentId, data) =>
  client.post(`/incidents/${incidentId}/assign-shelter`, data);

export const releaseShelterAssignment = (assignmentId) =>
  client.post(`/shelter-assignments/${assignmentId}/release`);
