import axios from 'axios';
import { authRequestInterceptor } from '../lib/interceptors/auth.interceptor';
import { responseErrorHandler, responseSuccessHandler } from '../lib/interceptors/error.interceptor';

/**
 * Instancia global de Axios configurada para la API.
 * 
 * Configurada con:
 * - `baseURL`: URL base desde variables de entorno.
 * - `Content-Type`: application/json por defecto.
 * 
 * Utiliza interceptores para:
 * - Inyectar el token de autenticación en cada petición.
 * - Manejar respuestas exitosas y errores globales (401, etc.).
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
