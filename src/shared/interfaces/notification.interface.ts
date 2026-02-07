/**
 * Notification interface matching backend NotificationResponseDto
 */
export interface Notification {
    id: number;
    mensaje: string;
    ticketId?: number;
    ticketTitulo?: string;
    fechaNotificacion: Date | string;
    estado: number;
}

/**
 * Paginated response for notifications
 */
export interface NotificationsResponse {
    data: Notification[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
    count: number;
}
