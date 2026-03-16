import api from './api';

export const getHODDashboard = () => api.get('/dashboard/hod');
export const getFacultyDashboard = () => api.get('/dashboard/faculty');
export const getStudentDashboard = () => api.get('/dashboard/student');
export const getPrincipalDashboard = () => api.get('/dashboard/principal');
export const getChiefSecretaryDashboard = () => api.get('/dashboard/chief-secretary');
