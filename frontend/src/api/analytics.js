import api from './axios'

export const getDashboard = () =>
  api.get('/api/v1/analytics/dashboard-summary/')
