import client from './client';

export const getAuditLogs = (params) => client.get('/audit-logs', { params });

export const getAuditLogById = (id) => client.get(`/audit-logs/${id}`);
