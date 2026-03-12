import api from '../api/axios';

export const getStudents = () => api.get('/admin/students');
export const getStudent = (id) => api.get(`/admin/students/${id}`);
export const createStudent = (data) => api.post('/admin/students', data);
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);

export const promoteStudents = (data) => api.post('/admin/students/promote', data);
export const passOutStudents = (data) => api.post('/admin/students/pass-out', data);
export const bulkUploadStudents = (data) => api.post('/admin/students/bulk', data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const promoteAllStudents = (data) => api.post('/admin/promote-all', data);
export const getPromotionPreview = (params) => api.get('/admin/promote-preview', { params });

export const getGradeSheet = (studentId, semester) => api.get(`/admin/students/${studentId}/gradesheet`, { params: { semester }, responseType: 'blob' });
