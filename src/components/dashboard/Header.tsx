
import { useAuth } from '../../context/useAuth';

interface HeaderProps {
    toggleMobileSidebar: () => void;
    title?: string;
}

export function Header({ toggleMobileSidebar, title = 'Dashboard' }: HeaderProps) {
    const { user, logout } = useAuth();

    return (
        <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleMobileSidebar}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            </div>
            <div className="flex items-center gap-6">
                <button
                    className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none">
                    <span className="material-symbols-outlined text-2xl">notifications</span>
                    <span
                        className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-red"></span>
                </button>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">
                            {user?.nombre} {user?.apellido}
                        </p>
                        <p className="text-xs text-capitalize text-gray-500">
                            {user?.role?.nombre || 'Sin Rol'}
                        </p>
                    </div>
                    {/* Logout Button (Temporary location or interactive dropdown) */}
                    <button
                        onClick={logout}
                        title="Cerrar Sesión"
                        className="h-10 w-10 rounded-full border-2 border-white shadow-sm bg-brand-blue flex items-center justify-center text-white hover:bg-brand-red transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
