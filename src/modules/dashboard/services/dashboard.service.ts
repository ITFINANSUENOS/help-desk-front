import { api } from '../../../core/api/api';

export interface RecentTicket {
    id: number;
    title: string;
    step: string;
    status: string;
    priority: string;
    customer: string;
    date: string;
    assignedBy: string;
}

export interface DashboardStats {
    assigned: number;
    managed: number;
    pending: number;
    total: number;
    recent: RecentTicket[];
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    },

    async getPendingTickets(): Promise<RecentTicket[]> {
        const response = await api.get<RecentTicket[]>('/dashboard/pending');
        return response.data;
    }
};
