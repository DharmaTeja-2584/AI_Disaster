import client from './client';

export const getUsers = () => client.get('/users');
export const getUserById = (id) => client.get(`/users/${id}`);
export const createUser = (data) => client.post('/users', data);
export const updateUserRole = (id, role) => client.patch(`/users/${id}/role`, { role });
