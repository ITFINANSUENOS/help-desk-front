import { type Notification } from '../../../shared/interfaces/notification.interface';
import { NotificationItem } from './NotificationItem';
import { IconBell } from '@tabler/icons-react';

interface NotificationListProps {
    notifications: Notification[];
    loading: boolean;
    activeTab: 'all' | 'unread';
    onMarkAsRead: (id: number) => void;
}

export const NotificationList = ({ notifications, loading, activeTab, onMarkAsRead }: NotificationListProps) => {

    // Helper to group notifications
    const groupNotificationsByDate = (notifs: Notification[]) => {
        const groups: { [key: string]: Notification[] } = {
            'Hoy': [],
            'Ayer': [],
            'Esta semana': [],
            'Anteriores': []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        notifs.forEach(notif => {
            const date = new Date(notif.fechaNotificacion);
            date.setHours(0, 0, 0, 0);

            if (date.getTime() === today.getTime()) {
                groups['Hoy'].push(notif);
            } else if (date.getTime() === yesterday.getTime()) {
                groups['Ayer'].push(notif);
            } else if (date >= thisWeek) {
                groups['Esta semana'].push(notif);
            } else {
                groups['Anteriores'].push(notif);
            }
        });

        return groups;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="bg-white p-5 rounded-full w-fit mx-auto shadow-sm mb-6">
                    <IconBell className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Todo al día</h3>
                <p className="text-gray-500 mt-2 text-base">No tienes notificaciones {activeTab === 'unread' ? 'pendientes' : 'aquí'}.</p>
            </div>
        );
    }

    const groupedNotifications = groupNotificationsByDate(notifications);
    const groupOrder = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores'];
    const sortedGroups = groupOrder.filter(key => groupedNotifications[key]?.length > 0);

    return (
        <div className="space-y-10">
            {sortedGroups.map(groupLabel => (
                <div key={groupLabel}>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        {groupLabel}
                    </h2>
                    <div className="grid gap-3">
                        {groupedNotifications[groupLabel].map((notif) => (
                            <NotificationItem
                                key={notif.id}
                                notification={notif}
                                onMarkAsRead={onMarkAsRead}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
