import api from './axios'

export const getProducts = (params) =>
  api.get('/api/v1/inventory/products/', { params })

export const getProduct = (id) =>
  api.get(`/api/v1/inventory/products/${id}/`)

export const createProduct = (data) =>
  api.post('/api/v1/inventory/products/', data)

export const updateProduct = (id, data) =>
  api.put(`/api/v1/inventory/products/${id}/`, data)

export const deleteProduct = (id) =>
  api.delete(`/api/v1/inventory/products/${id}/`)

export const adjustStock = (id, data) =>
  api.post(`/api/v1/inventory/products/${id}/adjust_stock/`, data)

export const getCategories = (params) =>
  api.get('/api/v1/inventory/categories/', { params })

export const createCategory = (data) =>
  api.post('/api/v1/inventory/categories/', data)

export const updateCategory = (id, data) =>
  api.put(`/api/v1/inventory/categories/${id}/`, data)

export const deleteCategory = (id) =>
  api.delete(`/api/v1/inventory/categories/${id}/`)

export const getStockMovements = (params) =>
  api.get('/api/v1/inventory/stock-movements/', { params })
