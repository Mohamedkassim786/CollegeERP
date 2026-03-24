import api from './api.js'
export const getResults = (params) => api.get('/exam/results', { params })
export const processGPA = (data) => api.post('/exam/process-gpa', data)
export const publishResult = (data) => api.post('/exam/publish', data)
export const unpublishResult = (data) => api.post('/exam/unpublish', data)
export const lockResult = (data) => api.post('/exam/lock', data)
export const unlockResult = (data) => api.post('/exam/unlock', data)
export const getPublishStatus = (params) => api.get('/exam/publish-status', { params })
export const getStudentResults = (params) => api.get('/student/results', { params })
export const generateMarkSheetA4 = (data) => api.post('/exam/marksheet/a4', data, { responseType: 'blob' })
export const generateMarkSheetA3 = (data) => api.post('/exam/marksheet/a3', data, { responseType: 'blob' })

export const getEndSemConsolidatedMarks = (params) => api.get('/exam/end-sem-marks', { params })
export const calculateConsolidatedGrades = (data) => api.post('/exam/end-sem-marks', data)

export const getConsolidatedResults = (params) => api.get('/exam/consolidated-results', { params })
export const calculateBulkGPA = (data) => api.post('/exam/calculate-bulk-gpa', data)
export const exportPortraitResults = (params) => api.get('/exam/export-portrait', { params, responseType: 'blob' })
export const exportLandscapeResults = (params) => api.get('/exam/export-landscape', { params, responseType: 'blob' })

export const exportProvisionalPortrait = (params) => api.get('/exam/export-portrait', { params, responseType: 'blob' })
export const exportProvisionalLandscape = (params) => api.get('/exam/export-landscape', { params, responseType: 'blob' })

export const getFacultyPublishedResults = (params) => api.get('/exam/faculty-results', { params })

export const getIndividualStudentResults = () => api.get('/exam/student-results')
export const getIndividualStudentResultsAdmin = (params) => api.get('/exam/student-results/admin', { params })
