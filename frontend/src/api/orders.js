import api from './axios'

export const getOrders = (params) =>
  api.get('/api/v1/orders/orders/', { params })

export const getOrder = (id) =>
  api.get(`/api/v1/orders/orders/${id}/`)

export const createOrder = (data) =>
  api.post('/api/v1/orders/orders/', data)

export const cancelOrder = (id) =>
  api.post(`/api/v1/orders/orders/${id}/cancel/`)

export const updateOrderStatus = (id, status) =>
  api.patch(`/api/v1/orders/orders/${id}/update_status/`, { status })
