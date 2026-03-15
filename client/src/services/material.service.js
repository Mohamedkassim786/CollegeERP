import api from './api';

export const getMaterials = (params) => api.get('/materials', { params });
export const uploadMaterial = (data) => api.post('/materials', data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);
