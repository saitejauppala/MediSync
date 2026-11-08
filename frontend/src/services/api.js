import axios from 'axios';

export const normalizeApiBaseUrl = (value) => {
  const configuredUrl = value?.trim().replace(/\/+$/, '');
  if (!configuredUrl) return '/api';

  const backendOrigin = configuredUrl.replace(/(?:\/api)+$/i, '');
  return `${backendOrigin}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medisync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If expired, clear token
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('medisync_token');
        localStorage.removeItem('medisync_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
