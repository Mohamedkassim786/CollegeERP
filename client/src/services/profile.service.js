import api from './api';

export const getMyProfile = () => api.get('/profile/me');
export const updateProfile = (data) => api.patch('/profile/update', data);
export const uploadProfilePhoto = (formData) => api.post('/profile/upload-photo', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
});
export const changePassword = (data) => api.post('/auth/change-password', data);

export const getProfile = () => api.get('/profile');
export const getFacultyProfile = () => api.get('/profile/faculty');
export const getActivityLogs = () => api.get('/profile/activity-logs');

export const updateSettingsProfile = (data) => api.put('/profile', data);
export const changeSettingsPassword = (data) => api.post('/profile/change-password', data);
