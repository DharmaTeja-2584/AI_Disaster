import client from './client';

export const getDamageReports = (params) => client.get('/damage-reports', { params });

export const getDamageReportById = (id) => client.get(`/damage-reports/${id}`);

export const getIncidentDamageReports = (incidentId) =>
  client.get(`/incidents/${incidentId}/damage-reports`);

export const submitDamageReport = (incidentId, data) =>
  client.post(`/incidents/${incidentId}/damage-reports`, data);
