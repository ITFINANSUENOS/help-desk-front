import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

/**
 * Notifications Bell Component with dropdown.
 * Displays unread count badge and notification list.
 */
export function NotificationsBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (id: number, ticketId: number | null) => {
        await markAsRead(id);
        setIsOpen(false);
        if (ticketId) {
            navigate(`/tickets/${ticketId}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
            >
                <span className="material-symbols-outlined text-2xl">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-red text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-bold text-gray-800">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-brand-blue hover:text-brand-red transition-colors"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="text-sm text-gray-500">Cargando...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
                                <p className="mt-2 text-sm text-gray-500">No hay notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification.id, notification.ticketId)}
                                    className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 ${notification.estado === 2 ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-brand-blue">info</span>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800">{notification.mensaje}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {new Date(notification.fechaNotificacion).toLocaleString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        {notification.estado === 2 && (
                                            <span className="h-2 w-2 rounded-full bg-brand-blue"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="border-t border-gray-200 px-4 py-2 text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="text-xs text-brand-blue hover:text-brand-red transition-colors"
                            >
                                Ver todas las notificaciones
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
