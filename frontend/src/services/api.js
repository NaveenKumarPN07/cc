/**
 * Axios API Client
 * Centralized HTTP client with interceptors
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    // Auto-logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect here; let the auth store handle it
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

// ─── API Service Methods ──────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  addAddress: (data) => api.post('/auth/address', data),
  deleteAddress: (id) => api.delete(`/auth/address/${id}`),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  deleteReview: (id) => api.delete(`/products/${id}/reviews`),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const orderAPI = {
  place: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  // Admin
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
};

export const uploadAPI = {
  uploadImages: (formData) =>
    api.post('/upload/product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (publicId) => api.delete(`/upload/${publicId}`),
};

export default api;
