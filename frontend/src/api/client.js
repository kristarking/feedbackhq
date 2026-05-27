import axios from 'axios';

// Use relative URLs — Vite proxy forwards /api/* to the backend container
const client = axios.create({
  baseURL: '/',
  timeout: 10000,
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: data => client.post('/api/auth/register', data),
  login:    data => client.post('/api/auth/login', data),
  logout:   ()   => client.post('/api/auth/logout'),
  me:       ()   => client.get('/api/auth/me'),
};

export const reviewsApi = {
  getAll:  params     => client.get('/api/reviews', { params }),
  getOne:  id         => client.get('/api/reviews/' + id),
  create:  data       => client.post('/api/reviews', data),
  update:  (id, data) => client.put('/api/reviews/' + id, data),
  remove:  id         => client.delete('/api/reviews/' + id),
};

export const productsApi = {
  getAll: ()  => client.get('/api/products'),
  getOne: id  => client.get('/api/products/' + id),
};

export const adminApi = {
  getStats:     ()  => client.get('/api/admin/stats'),
  getUsers:     ()  => client.get('/api/admin/users'),
  deleteReview: id  => client.delete('/api/admin/reviews/' + id),
};

export default client;
