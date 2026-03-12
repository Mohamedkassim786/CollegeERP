import api from './api.js'

export const getArrears = () => api.get('/admin/arrears')
export const uploadArrears = (formData) => api.post('/admin/arrears/upload', formData)
export const autoGenerateArrears = (semester) => api.post('/admin/arrears/auto-generate', { semester })
export const deleteArrear = (id) => api.delete(`/admin/arrears/${id}`)
export const uploadBulkPassedOutArrears = (formData) => api.post('/admin/arrears/bulk-passedout', formData)
