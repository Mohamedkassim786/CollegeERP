import api from './api.js'
export const getHallSessions = () => api.get('/admin/hall-allocation/sessions')
export const createHallSession = (data) => api.post('/admin/hall-allocation/sessions', data)
export const generateAllocation = (data) => api.post('/admin/hall-allocation/generate', data)
export const getDispatchSubjects = () => api.get('/admin/dispatch/subjects')
export const getDispatchStudents = (params) => api.get('/admin/dispatch/students', { params })
export const exportDispatchPDF = (data) => api.post('/admin/dispatch/export-pdf', data, { responseType: 'blob' })
export const getDummyMapping = (params) => api.get('/admin/dummy-mapping', { params })
export const generateDummyNumbers = (data) => api.post('/admin/dummy-mapping/generate', data)

export const getHalls = () => api.get('/hall-allocation/halls')
export const getExamAttendanceSessions = () => api.get('/exam-sheet/sessions')
export const generateExamAttendanceSheet = (params) => api.get('/exam-sheet/generate', { params, responseType: 'blob' })

export const createHall = (data) => api.post('/admin/hall-allocation/halls', data)
export const getHallAllocations = (sessionId) => api.get(`/admin/hall-allocation/sessions/${sessionId}/allocations`)
export const lockHallSession = (sessionId, data) => api.patch(`/admin/hall-allocation/sessions/${sessionId}/lock`, data)
export const deleteHallSession = (id) => api.delete(`/admin/hall-allocation/sessions/${id}`)
export const deleteHall = (id) => api.delete(`/admin/hall-allocation/halls/${id}`)
export const exportHallAllocationPDF = (sessionId) => api.get(`/admin/hall-allocation/sessions/${sessionId}/export`, { responseType: 'blob' })
export const exportHallGridPDF = (sessionId) => api.get(`/admin/hall-allocation/sessions/${sessionId}/export-grid`, { responseType: 'blob' })
export const updateHallSessionSubjects = (sessionId, data) => api.put(`/admin/hall-allocation/sessions/${sessionId}/subjects`, data)

export const generateHallTickets = (params) => api.get('/hall-ticket/generate', { params, responseType: 'blob' })
