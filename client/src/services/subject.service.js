import api from './api.js'

export const getSubjects = () => api.get('/admin/subjects')
export const createSubject = (data) => api.post('/admin/subjects', data)
export const deleteSubject = (id) => api.delete(`/admin/subjects/${id}`)

export const assignFaculty = (data) => api.post('/admin/assign-faculty', data)
export const removeAssignment = (id) => api.delete(`/admin/assign-faculty/${id}`)
