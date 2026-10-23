import client from './client';

export const getDemoStatus = () => client.get('/demo/status');
export const loadDemoScenario = () => client.post('/demo/load-scenario');
export const resetDemoBaseline = () => client.post('/demo/reset', { confirm: true });
