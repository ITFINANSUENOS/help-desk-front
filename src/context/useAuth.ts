import { useContext, createContext } from 'react';
import type { User } from '../interfaces/User';
import type { LoginCredentials } from '../interfaces/Auth';

/**
 * Definición del tipo de contexto de autenticación.
 */
export interface AuthContextType {
    /** Usuario autenticado actual o null si no hay sesión. */
    user: User | null;
    /** Indica si se está cargando la información del usuario (o verificando sesión). */
    loading: boolean;
    /** Función para iniciar sesión. */
    login: (credentials: LoginCredentials) => Promise<void>;
    /** Función para cerrar sesión. */
    logout: () => void;
    /** Helper booleano para verificar si hay un usuario. */
    isAuthenticated: boolean;
}

/**
 * Contexto de React para manejar el estado global de autenticación.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personalizado para consumir el contexto de autenticación.
 * 
 * @throws {Error} Si se usa fuera de un `AuthProvider`.
 * @returns {AuthContextType} El contexto de autenticación.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
