
import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { User } from '../interfaces/User';
import type { LoginCredentials } from '../interfaces/Auth';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const userData = await authService.getProfile();
                // We now expect the backend to return 'permissions' inside the user profile
                setUser(userData);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            localStorage.removeItem('token'); // Clear invalid token
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);
        localStorage.setItem('token', response.accessToken);
        await fetchProfile(); // Load user data immediately after login
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}
