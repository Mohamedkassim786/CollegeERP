import api from './api.js'
export const getSystemUsers = () => api.get('/admin/settings/system-users')
export const createSystemUser = (data) => api.post('/admin/settings/create-system-user', data)
export const resetSystemUser = (data) => api.put('/admin/settings/reset-system-user', data)
export const getActivityLogs = (params) => api.get('/admin/settings/activity-logs', { params })
export const passOutStudents = (data) => api.post('/admin/students/pass-out', data)
export const getDepartments = () => api.get('/admin/departments')
export const getSections = () => api.get('/admin/sections')
export const getDashboardStats = () => api.get('/admin/stats')
