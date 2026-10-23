import client from './client';

export const createIncident = (data) => client.post('/incidents', data);

export const getIncidents = (params) => client.get('/incidents', { params });

export const getIncidentById = (id) => client.get(`/incidents/${id}`);

export const updateIncidentStatus = (id, status) => client.patch(`/incidents/${id}/status`, { status });
