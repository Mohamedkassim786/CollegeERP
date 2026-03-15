import api from './api';

export const getHODDashboard = () => api.get('/api/dashboard/hod');
export const getFacultyDashboard = () => api.get('/dashboard/faculty');
export const getStudentDashboard = () => api.get('/api/dashboard/student');
export const getPrincipalDashboard = () => api.get('/api/dashboard/principal');
export const getChiefSecretaryDashboard = () => api.get('/api/dashboard/chief-secretary');
