import { api } from './api';
import type { Permission } from './rbac';

/**
 * Credenciales necesarias para identificar a un usuario.
 */
export interface LoginCredentials {
    email: string; // The API expects 'email'
    password: string;
}

/**
 * Respuesta del servidor tras un login exitoso.
 */
export interface AuthResponse {
    accessToken: string;
}

/**
 * Representación del Usuario en el sistema.
 * Basado en la entidad de usuarios del backend.
 */
export interface User {
    usu_id: number;
    usu_correo: string;
    rol_id: number | null;
    reg_id: number | null;
    car_id: number | null;
    dp_id: number | null;
    es_nacional: boolean;
    permissions?: Permission[];
}

/**
 * Servicio de Autenticación.
 * Encapsula todas las llamadas a endpoints relacionados con auth.
 */
export const authService = {
    /**
     * Inicia sesión en el servidor.
     * @param credentials Objeto con email y contraseña.
     * @returns Promesa con el accessToken.
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    /**
     * Obtiene el perfil del usuario autenticado actual.
     */
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/profile');
        return response.data;
    },

    /**
     * Cierra la sesión localmente.
     * Nota: Esto solo elimina el token del navegador.
     */
    logout() {
        localStorage.removeItem('token');
        // Redirect logic can be handled by the component or router
    }
};
