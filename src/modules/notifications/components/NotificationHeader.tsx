import { IconChecks } from '@tabler/icons-react';

interface NotificationHeaderProps {
    onMarkAllAsRead: () => void;
}

export const NotificationHeader = ({ onMarkAllAsRead }: NotificationHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    Centro de Notificaciones
                </h1>
                <p className="text-gray-500 text-base mt-2 max-w-2xl">
                    Gestiona tus alertas, asignaciones y novedades del sistema en un solo lugar.
                </p>
            </div>

            <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
            >
                <IconChecks className="w-5 h-5" />
                Marcar todas leídas
            </button>
        </div>
    );
};
