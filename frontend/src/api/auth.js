import client from './client';

/**
 * Auth API functions
 * All endpoints mapped to /api/auth/*
 */
export const loginUser = (data) => client.post('/auth/login', data);

export const registerUser = (data) => client.post('/auth/register', data);

export const getMe = () => client.get('/auth/me');

export const checkHealth = () => client.get('/health');
