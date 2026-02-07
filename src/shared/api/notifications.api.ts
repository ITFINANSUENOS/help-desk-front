import { api } from '../../core/api/api';
import type { NotificationsResponse, UnreadCountResponse } from '../interfaces/notification.interface';

/**
 * API Service for managing notifications.
 * Provides methods to fetch, count, and mark notifications as read.
 */
class NotificationsApiService {
    private readonly baseUrl = '/notifications';

    /**
     * Get paginated notifications for the current user.
     * @param page - Page number (default: 1)
     * @param limit - Items per page (default: 20)
     */
    async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationsResponse> {
        const response = await api.get<NotificationsResponse>(this.baseUrl, {
            params: { page, limit }
        });
        return response.data;
    }

    /**
     * Get count of unread notifications.
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get<UnreadCountResponse>(`${this.baseUrl}/unread/count`);
        return response.data.count;
    }

    /**
     * Mark a specific notification as read.
     * @param id - Notification ID
     */
    async markAsRead(id: number): Promise<void> {
        await api.patch(`${this.baseUrl}/${id}/read`);
    }

    /**
     * Mark all notifications as read for the current user.
     */
    async markAllAsRead(): Promise<void> {
        await api.patch(`${this.baseUrl}/read-all`);
    }
}

export const notificationsApi = new NotificationsApiService();
