import { api } from './api';
import type { LoginCredentials, AuthResponse } from '../interfaces/Auth';
import type { User } from '../interfaces/User';

/**
 * Servicio de Autenticación.
 */
export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/profile');
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
    }
};
