import axios from 'axios';

// Create a configured axios instance
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '', // Use proxy in dev
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Redirect to login on 401, but careful with loops
        if (error.response?.status === 401) {
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
