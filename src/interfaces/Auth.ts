/**
 * Credenciales necesarias para identificar a un usuario.
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Respuesta del servidor tras un login exitoso.
 */
export interface AuthResponse {
    accessToken: string;
}
