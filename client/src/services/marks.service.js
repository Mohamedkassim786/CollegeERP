import api from './api';

export const getFacultyMarks = (subjectId) => api.get(`/faculty/marks/${subjectId}`);
export const submitFacultyMarks = (data) => api.post('/faculty/marks', data);
