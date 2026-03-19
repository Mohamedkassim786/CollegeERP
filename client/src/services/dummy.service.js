import api from './api.js'

export const getAvailableSubjects = (semester) => api.get(`/dummy/get-available`, { params: { semester } })
export const getDummyMappings = (params) => api.get(`/dummy/mapping`, { params })
export const generateDummyNumbers = (data) => api.post('/dummy/generate', data)
export const lockDummyMapping = (data) => api.post('/dummy/lock', data)
export const unlockDummyMapping = (data) => api.post('/dummy/unlock', data)
export const approveExternalMarks = (data) => api.post('/dummy/approve', data)
export const rejectExternalMarks = (data) => api.post('/dummy/reject', data)
