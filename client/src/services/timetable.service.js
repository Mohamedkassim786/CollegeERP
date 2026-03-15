import api from './api.js'

export const getTimetable = (params) => api.get('/admin/timetable', { params })
export const saveTimetable = (data) => api.post('/admin/timetable', data)

export const getFacultyAbsences = (date) => api.get('/admin/faculty-absences', { params: { date } })
export const markFacultyAbsent = (data) => api.post('/admin/faculty-absences', data)
export const deleteFacultyAbsence = (params) => api.delete('/admin/faculty-absences', { params })

export const getSubstitutions = (date) => api.get('/admin/substitutions', { params: { date } })
export const assignSubstitute = (data) => api.post('/admin/substitutions', data)
export const deleteSubstitution = (id) => api.delete(`/admin/substitutions/${id}`)

export const getFacultyAvailability = (date, period) => api.get('/admin/faculty/availability', { params: { date, period } })

export const getFacultyTimetable = (params) => api.get('/faculty/timetable', { params })
