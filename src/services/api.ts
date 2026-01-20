import axios from 'axios';
import { authRequestInterceptor } from '../lib/interceptors/auth.interceptor';
import { responseErrorHandler, responseSuccessHandler } from '../lib/interceptors/error.interceptor';

/**
 * Instancia global de Axios configurada para la API.
 */
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Registrar interceptores
api.interceptors.request.use(
    authRequestInterceptor,
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    responseSuccessHandler,
    responseErrorHandler
);
