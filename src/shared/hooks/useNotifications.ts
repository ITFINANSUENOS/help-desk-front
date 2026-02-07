import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications.api';
import { notificationsWs } from '../services/notifications-ws.service';
import type { Notification } from '../interfaces/notification.interface';

/**
 * Hook for managing notifications with WebSocket and REST API.
 * Provides real-time updates and methods to fetch/mark notifications.
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * Fetch unread count from API
     */
    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationsApi.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('[useNotifications] Error fetching unread count:', error);
        }
    }, []);

    /**
     * Fetch notifications from API
     */
    const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
        setLoading(true);
        try {
            const response = await notificationsApi.getNotifications(page, limit);
            setNotifications(response.data);
        } catch (error) {
            console.error('[useNotifications] Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Mark a notification as read
     */
    const markAsRead = useCallback(async (id: number) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, estado: 0 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[useNotifications] Error marking as read:', error);
        }
    }, []);

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, estado: 0 })));
            setUnreadCount(0);
        } catch (error) {
            console.error('[useNotifications] Error marking all as read:', error);
        }
    }, []);

    /**
     * Handle new notification from WebSocket
     */
    const handleNewNotification = useCallback((data: any) => {
        console.log('[useNotifications] New notification received:', data);

        // Add to notifications list
        const newNotification: Notification = {
            id: Date.now(), // Temporary ID until we fetch from API
            mensaje: data.mensaje,
            ticketId: data.ticketId,
            fechaNotificacion: new Date(data.fecha),
            estado: 2,
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, []);

    /**
     * Handle ticket overdue notification
     */
    const handleTicketOverdue = useCallback((data: any) => {
        console.log('[useNotifications] Ticket overdue:', data);
        // You can show a toast or alert here
    }, []);

    useEffect(() => {
        // Connect to WebSocket
        notificationsWs.connect();

        // Subscribe to events
        notificationsWs.on('new_notification', handleNewNotification);
        notificationsWs.on('ticket_overdue', handleTicketOverdue);

        // Fetch initial data
        fetchUnreadCount();
        fetchNotifications();

        // Cleanup on unmount
        return () => {
            notificationsWs.off('new_notification', handleNewNotification);
            notificationsWs.off('ticket_overdue', handleTicketOverdue);
        };
    }, [handleNewNotification, handleTicketOverdue, fetchUnreadCount, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}
