import api from './api';

export const getAcademicYears = () => api.get('/admin/academic-years');
export const createAcademicYear = (data) => api.post('/admin/academic-years', data);
export const activateAcademicYear = (id) => api.patch(`/admin/academic-years/${id}/activate`);
