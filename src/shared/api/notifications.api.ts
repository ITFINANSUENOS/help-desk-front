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
     * @param status - Optional status filter (2=Unread/Seen, 1=Read)
     */
    async getNotifications(page: number = 1, limit: number = 20, status?: number): Promise<NotificationsResponse> {
        const params: any = { page, limit };
        if (status !== undefined) {
            params.status = status;
        }

        const response = await api.get<NotificationsResponse>(this.baseUrl, { params });
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
     * Mark a specific notification as read (State 1).
     * @param id - Notification ID
     */
    async markAsRead(id: number): Promise<void> {
        await api.patch(`${this.baseUrl}/${id}/read`);
    }

    /**
     * Mark a specific notification as seen (State 3 -> 2).
     * @param id - Notification ID
     */
    async markAsSeen(id: number): Promise<void> {
        await api.patch(`${this.baseUrl}/${id}/seen`);
    }

    /**
     * Mark all notifications as read for the current user.
     */
    async markAllAsRead(): Promise<void> {
        await api.patch(`${this.baseUrl}/read-all`);
    }
}

export const notificationsApi = new NotificationsApiService();
