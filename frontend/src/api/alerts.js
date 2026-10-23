import client from './client';

export const getAlerts = (params) => client.get('/alerts', { params });

export const getAlertById = (id) => client.get(`/alerts/${id}`);

export const createAlert = (data) => client.post('/alerts', data);

export const acknowledgeAlert = (id) => client.patch(`/alerts/${id}/acknowledge`);

export const getIncidentAlerts = (incidentId) => client.get(`/incidents/${incidentId}/alerts`);

export const createIncidentAlert = (incidentId, data) => client.post(`/incidents/${incidentId}/alerts`, data);
