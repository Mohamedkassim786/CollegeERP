import api from './api';

export const getClassDetails = (subjectId, params) => api.get(`/faculty/class/${subjectId}/details`, { params });
export const getClassStudents = (subjectId, params) => api.get(`/faculty/class/${subjectId}/students`, { params });
export const getClassAttendanceLogs = (subjectId) => api.get(`/faculty/class/${subjectId}/attendance`);
export const exportClassAttendance = (subjectId, params) => api.get(`/faculty/class/${subjectId}/attendance/export-excel`, { params, responseType: 'blob' });
