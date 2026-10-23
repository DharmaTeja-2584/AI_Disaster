import client from './client';

export const getDashboardMetrics = () => client.get('/dashboard/metrics');
