import api from './api.js'

export const getDepartments = () => api.get('/admin/departments')
export const createDepartment = (data) => api.post('/admin/departments', data)
export const updateDepartment = (id, data) => api.put(`/admin/departments/${id}`, data)
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`)

export const getSections = () => api.get('/admin/sections')
export const createSection = (data) => api.post('/admin/sections', data)
export const deleteSection = (id) => api.delete(`/admin/sections/${id}`)
