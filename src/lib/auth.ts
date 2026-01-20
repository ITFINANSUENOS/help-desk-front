import { api } from './api';

export interface LoginCredentials {
    email: string; // The API expects 'email'
    password: string;
}

export interface AuthResponse {
    accessToken: string;
}

export interface User {
    usu_id: number;
    usu_correo: string;
    rol_id: number | null;
    reg_id: number | null;
    car_id: number | null;
    dp_id: number | null;
    es_nacional: boolean;
}

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
        // Redirect logic can be handled by the component or router
    }
};
