import api from './api.js'
export const getFaculty = (params) => api.get('/admin/faculty', { params })
export const getFacultyById = (id) => api.get(`/admin/faculty/${id}`)
export const createFaculty = (formData) => api.post('/admin/faculty', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const updateFaculty = (id, formData) => api.patch(`/admin/faculty/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteFaculty = (id) => api.delete(`/admin/faculty/${id}`)
export const bulkUploadFaculty = (formData) => api.post('/admin/faculty/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})

export const getFacultyAbsences = (params) => api.get('/admin/faculty-absences', { params })
export const markFacultyAbsent = (data) => api.post('/admin/faculty-absences', data)
export const removeFacultyAbsence = (params) => api.delete('/admin/faculty-absences', { params })

export const getSubstitutions = (params) => api.get('/admin/substitutions', { params })
export const assignSubstitution = (data) => api.post('/admin/substitutions', data)
export const deleteSubstitution = (id) => api.delete(`/admin/substitutions/${id}`)

export const getTimetable = (params) => api.get('/admin/timetable', { params })

export const toggleFacultyStatus = (data) => api.post('/profile/faculty/toggle-status', data)
export const resetFacultyPassword = (data) => api.post('/profile/faculty/reset-password', data)

export const getFacultyDashboardStats = () => api.get('/faculty/stats')
export const getActiveSessions = () => api.get('/faculty/sessions')

export const getFacultyAssignments = () => api.get('/faculty/assignments')
