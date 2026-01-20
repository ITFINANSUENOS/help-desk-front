import { api } from './api';
import type { LoginCredentials, AuthResponse } from '../interfaces/Auth';
import type { User } from '../interfaces/User';

/**
 * Servicio de Autenticación.
 * Maneja el inicio de sesión, obtención de perfil y cierre de sesión.
 */
export const authService = {
    /**
     * Inicia sesión con credenciales de usuario.
     * @param credentials Objeto con email y password.
     * @returns Promesa con la respuesta de autenticación (token).
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    /**
     * Obtiene el perfil del usuario autenticado actual.
     * @returns Promesa con los datos completos del usuario (incluyendo roles y permisos).
     */
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/profile');
        return response.data;
    },

    /**
     * Cierra la sesión localmente eliminando el token.
     */
    logout() {
        localStorage.removeItem('token');
    }
};
