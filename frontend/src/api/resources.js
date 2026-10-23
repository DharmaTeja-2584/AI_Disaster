import client from './client';

export const getResources = (params) => client.get('/resources', { params });

export const getResourceById = (id) => client.get(`/resources/${id}`);

export const updateResourceStatus = (id, status) =>
  client.patch(`/resources/${id}/status`, { status });

export const getResourceMetrics = () => client.get('/resources/metrics');

export const allocateResource = (incidentId, data) =>
  client.post(`/incidents/${incidentId}/allocate-resource`, data);

export const releaseResourceAllocation = (allocationId) =>
  client.post(`/resource-allocations/${allocationId}/release`);
