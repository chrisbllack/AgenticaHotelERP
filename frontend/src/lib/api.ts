import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('infineon_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const propertyId = localStorage.getItem('infineon_property_id');
  if (propertyId) {
    config.headers['X-Property-ID'] = propertyId;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('infineon_token');
      localStorage.removeItem('infineon_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const API_BASE = '/api/v1';

export { api };
export default api;
