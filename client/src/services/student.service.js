import api from '../api/axios';

export const getStudents = () => api.get('/admin/students');
export const getStudent = (id) => api.get(`/admin/students/${id}`);
export const createStudent = (data) => api.post('/admin/students', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);

export const bulkUploadStudents = (data) => api.post('/admin/students/bulk', data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const executeGlobalPromotion = () => api.post('/admin/promote-global');
export const promoteFirstYearBatch = (data) => api.post('/admin/promote-first-years', data);
export const getPromotionPreview = (params) => api.get('/admin/promote-preview', { params });

export const getGradeSheet = (studentId, semester) => api.get(`/admin/students/${studentId}/gradesheet`, { params: { semester }, responseType: 'blob' });
export const getIDCard = (studentId) => api.get(`/admin/students/${studentId}/idcard`, { responseType: 'blob' });
