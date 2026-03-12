import api from './api.js'

export const getExternalAssignments = () => api.get('/external/admin/assignments')
export const getAvailableSubjectsForExternal = () => api.get('/external/admin/available-subjects')
export const getExternalStaff = () => api.get('/external/admin/staff')
export const assignExternalMarkEntry = (data) => api.post('/external/admin/assign-mark-entry', data)
export const createExternalStaff = (data) => api.post('/external/admin/staff', data)
export const deleteExternalStaff = (id) => api.delete(`/external/admin/staff/${id}`)
export const deleteExternalAssignment = (id) => api.delete(`/external/admin/assignments/${id}`)

export const getMyExternalAssignments = () => api.get('/external/assignments')
export const getExternalMarksByAssignment = (id, params) => api.get(`/external/marks/assignment/${id}`, { params })
export const submitExternalMarks = (data) => api.post('/external/marks/submit', data)
export const getExternalMarksPDF = (params) => api.get('/external/marks/statement-pdf', { params, responseType: 'blob' })
