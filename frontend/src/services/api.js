import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseURL = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  
  // Remove trailing slash if present
  envUrl = envUrl.replace(/\/$/, '');
  
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrishield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrishield_token');
      localStorage.removeItem('agrishield_user');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please slow down and try again later.', { id: 'rate-limit' });
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.', { id: 'server-error' });
    } else if (error.message === 'Network Error') {
      toast.error('Network Error: Please check your internet connection.', { id: 'network-error' });
    }
    return Promise.reject(error);
  }
);

export default api;
