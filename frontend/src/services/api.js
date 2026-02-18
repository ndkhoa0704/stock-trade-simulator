import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Skip redirect for /auth/me — a 401 there just means not logged in
    if (err.response?.status === 401 && !err.config.url.includes('/auth/me')) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
