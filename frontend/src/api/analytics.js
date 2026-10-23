import client from './client';

export const getAnalyticsOverview = (params) => client.get('/analytics/overview', { params });

export const getIncidentAnalytics = (params) => client.get('/analytics/incidents', { params });

export const getResourceAnalytics = () => client.get('/analytics/resources');

export const getTeamAnalytics = () => client.get('/analytics/teams');

export const getShelterAnalytics = () => client.get('/analytics/shelters');

export const getAiAnalytics = () => client.get('/analytics/ai');

export const getRiskHotspots = () => client.get('/analytics/hotspots');
