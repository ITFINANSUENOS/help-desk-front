import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Componente de protección de rutas.
 * 
 * Verifica si el usuario está autenticado:
 * - Si está cargando, muestra un spinner.
 * - Si no hay usuario, redirige a `/login`.
 * - Si hay usuario, renderiza el contenido de la ruta (`Outlet`).
 */
export const AuthGuard = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f8f8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
