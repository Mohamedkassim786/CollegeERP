import api from './api.js'

export const getEligibility = (params) => api.get('/eligibility', { params })
export const calculateAndSaveEligibility = (data) => api.post('/eligibility/calculate', data)
export const grantEligibilityException = (data) => api.post('/eligibility/exception', data)
export const lockEligibility = (data) => api.post('/eligibility/lock', data)
