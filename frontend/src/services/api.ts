import axios from 'axios';

// Point Axios at Express API endpoint
const API = axios.create({
  baseURL: '/api',
});

// Inject token into headers on request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pocketpilot-token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept unauthorized errors to boot session
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pocketpilot-token');
      // Redirect to login if window is available
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
