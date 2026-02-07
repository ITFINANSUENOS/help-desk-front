import { useState, useEffect, useCallback } from 'react';
import { useNotificationsContext } from '../../../shared/context/NotificationsContext';
import { notificationsApi } from '../../../shared/api/notifications.api';
import type { Notification } from '../../../shared/interfaces/notification.interface';
import { NotificationHeader } from '../components/NotificationHeader';
import { NotificationFilters } from '../components/NotificationFilters';
import { NotificationList } from '../components/NotificationList';

export default function NotificationsPage() {
    const { fetchNotifications: refreshGlobalBadge } = useNotificationsContext();

    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 20;

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const statusFilter = activeTab === 'unread' ? 2 : undefined;
            const response = await notificationsApi.getNotifications(page, PAGE_SIZE, statusFilter);
            setNotifications(response.data);
            setTotalPages(response.metadata.totalPages);
        } catch (error) {
            console.error('Error fetching notifications page:', error);
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationsApi.markAsRead(id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, estado: 1 } : n));
            refreshGlobalBadge();
        } catch (error) {
            console.error('Error marking as read:', error);
            fetchPageData(); // Revert on error
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            fetchPageData();
            refreshGlobalBadge();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="p-6 md:p-8 w-full max-w-7xl mx-auto">
            <NotificationHeader onMarkAllAsRead={handleMarkAllAsRead} />

            <NotificationFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <NotificationList
                notifications={notifications}
                loading={loading}
                activeTab={activeTab}
                onMarkAsRead={handleMarkAsRead}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}
