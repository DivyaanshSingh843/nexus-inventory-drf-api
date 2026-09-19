import api from './axios'

export const login = (email, password) =>
  api.post('/api/v1/auth/token/', { email, password })

export const refreshToken = (refresh) =>
  api.post('/api/v1/auth/token/refresh/', { refresh })

export const register = (data) =>
  api.post('/api/v1/auth/register/', data)

export const getProfile = () =>
  api.get('/api/v1/auth/profile/')

export const updateProfile = (data) =>
  api.put('/api/v1/auth/profile/', data)

export const getUsers = (params) =>
  api.get('/api/v1/auth/users/', { params })
