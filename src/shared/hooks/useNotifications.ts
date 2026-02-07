import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications.api';
import { notificationsWs } from '../services/notifications-ws.service';
import type { Notification } from '../interfaces/notification.interface';
import type { Toast } from './useToast';

interface UseNotificationsOptions {
    showToast?: (toast: Omit<Toast, 'id'>, onDismiss?: () => void) => void;
}

/**
 * Hook for managing notifications with WebSocket and REST API.
 * Provides real-time updates and methods to fetch/mark notifications.
 * Also displays toast notifications for real-time events if showToast is provided.
 */
export function useNotifications(options?: UseNotificationsOptions) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const { showToast } = options || {};

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
     * Mark a notification as seen (Toast dismissed)
     */
    const markAsSeen = useCallback(async (id: number) => {
        try {
            await notificationsApi.markAsSeen(id);
            // Update local state: 3 -> 2
            setNotifications(prev => prev.map(n => n.id === id && n.estado === 3 ? { ...n, estado: 2 } : n));
        } catch (error) {
            console.error('[useNotifications] Error marking as seen:', error);
        }
    }, []);

    /**
     * Handle new notification from WebSocket
     */
    const handleNewNotification = useCallback((data: any) => {
        console.log('[useNotifications] New notification received:', data);

        // Add to notifications list
        const newNotification: Notification = {
            id: data.id || Date.now(),
            mensaje: data.mensaje,
            ticketId: data.ticketId,
            fechaNotificacion: new Date(data.fecha),
            estado: 3, // New / Toast Pending
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast notification if available
        if (showToast) {
            showToast({
                message: data.mensaje,
                type: 'info',
                ticketId: data.ticketId,
                duration: 6000,
            }, () => markAsSeen(newNotification.id));
        }
    }, [showToast, markAsSeen]);

    /**
     * Handle ticket overdue notification
     */
    const handleTicketOverdue = useCallback((data: any) => {
        console.log('[useNotifications] Ticket overdue:', data);

        // Show warning toast if available
        if (showToast) {
            showToast({
                message: `⚠️ Ticket #${data.ticketId} ha vencido su SLA`,
                type: 'warning',
                ticketId: data.ticketId,
                duration: 8000,
            }, () => {
                // If we had a real notification ID here, we would markAsSeen
                // data.id might be available if backend sends it
            });
        }
    }, [showToast]);

    /**
     * Handle ticket closed notification
     */
    const handleTicketClosed = useCallback((data: any) => {
        console.log('[useNotifications] Ticket closed:', data);

        // Add to notifications list
        const newNotification: Notification = {
            id: data.id || Date.now(),
            mensaje: data.mensaje,
            ticketId: data.ticketId,
            fechaNotificacion: new Date(data.fecha),
            estado: 3,
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show success toast if available
        if (showToast) {
            showToast({
                message: data.mensaje,
                type: 'success',
                ticketId: data.ticketId,
                duration: 6000,
            }, () => markAsSeen(newNotification.id));
        }
    }, [showToast, markAsSeen]);

    useEffect(() => {
        // Connect to WebSocket
        notificationsWs.connect();

        // Subscribe to events
        notificationsWs.on('new_notification', handleNewNotification);
        notificationsWs.on('ticket_overdue', handleTicketOverdue);
        notificationsWs.on('ticket_closed', handleTicketClosed);

        // Fetch initial data
        fetchUnreadCount();
        fetchNotifications();

        // Cleanup on unmount
        return () => {
            notificationsWs.off('new_notification', handleNewNotification);
            notificationsWs.off('ticket_overdue', handleTicketOverdue);
            notificationsWs.off('ticket_closed', handleTicketClosed);
        };
    }, [handleNewNotification, handleTicketOverdue, handleTicketClosed, fetchUnreadCount, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}
