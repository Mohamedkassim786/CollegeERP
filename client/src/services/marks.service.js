import api from './api.js';

export const getFacultyMarks = (subjectId) => api.get(`/faculty/marks/${subjectId}`);
export const submitFacultyMarks = (data) => api.post('/faculty/marks', data);

// Admin Marks Management
export const getMarksForAdmin = (subjectId) => api.get(`/admin/marks/${subjectId}`);
export const updateMarksForAdmin = (data) => api.post('/admin/marks', data);

// Marks Approval System
export const getApprovalStatus = () => api.get('/admin/marks-approval/status');
export const getSubjectMarks = (subjectId) => api.get(`/admin/marks-approval/${subjectId}`);
export const approveMarks = (data) => api.post('/admin/marks-approval/approve', data);
export const unlockMarks = (data) => api.post('/admin/marks-approval/unlock', data);
export const unapproveMarks = (data) => api.post('/admin/marks-approval/unapprove', data);

// External Marks
export const submitAdminExternalMarks = (data) => api.post('/external/marks/submit-admin', data);
