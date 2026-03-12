import api from './api.js'
export const getFaculty = (params) => api.get('/admin/faculty', { params })
export const createFaculty = (data) => api.post('/admin/faculty', data)
export const updateFaculty = (id, data) => api.put(`/admin/faculty/${id}`, data)
export const deleteFaculty = (id) => api.delete(`/admin/faculty/${id}`)
export const getFacultyById = (id) => api.get(`/faculty/${id}`)
export const assignHOD = (data) => api.post('/api/profile/faculty/assign-hod', data)
export const uploadFacultyPhoto = (id, formData) => api.post(`/admin/faculty/${id}/photo`, formData)

export const getFacultyAbsences = (params) => api.get('/admin/faculty-absences', { params })
export const markFacultyAbsent = (data) => api.post('/admin/faculty-absences', data)
export const removeFacultyAbsence = (params) => api.delete('/admin/faculty-absences', { params })

export const getSubstitutions = (params) => api.get('/admin/substitutions', { params })
export const assignSubstitution = (data) => api.post('/admin/substitutions', data)
export const deleteSubstitution = (id) => api.delete(`/admin/substitutions/${id}`)

export const getTimetable = (params) => api.get('/admin/timetable', { params })

export const toggleFacultyStatus = (data) => api.post('/profile/faculty/toggle-status', data)
export const resetFacultyPassword = (data) => api.post('/profile/faculty/reset-password', data)

export const getFacultyAssignments = () => api.get('/faculty/assignments')
