

import { useAuth } from '../../../modules/auth/context/useAuth';
import { NotificationsBell } from './NotificationsBell';
import { UserDropdown } from './UserDropdown';

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
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>menu</span>
                </button>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
                <NotificationsBell />
                <div className="h-8 w-px bg-gray-200"></div>
                <UserDropdown
                    userName={`${user?.nombre} ${user?.apellido}`}
                    userRole={user?.role?.nombre || 'Sin Rol'}
                    onLogout={logout}
                />
            </div>
        </header>
    );
}
