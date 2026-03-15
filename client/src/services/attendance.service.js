import api from './api.js'
export const getAttendanceStudents = (params) => api.get('/faculty/attendance/students', { params })
export const submitAttendance = (data) => api.post('/faculty/attendance', data)
export const getAttendanceReport = (params) => api.get('/faculty/attendance/report', { params })
export const getAdminAttendanceReport = (params) => api.get('/admin/attendance/report', { params })
export const getDepartmentAttendanceReport = (params) => api.get('/admin/attendance-report', { params })
export const exportAttendanceExcel = (params) => api.get('/admin/attendance/export-excel', { params, responseType: 'blob' })
export const getStudentAttendance = (params) => api.get('/student/attendance', { params })
