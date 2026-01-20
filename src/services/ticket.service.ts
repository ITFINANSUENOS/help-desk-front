import { api } from './api';
import type { Ticket, TicketFilter, TicketListResponse, CreateTicketDto, TicketStatus, TicketPriority } from '../interfaces/Ticket';

// Interface for the raw backend response (Spanish fields)
interface RawTicket {
    id: number;
    titulo: string;
    creadorNombre?: string;
    estado: string;
    prioridadUsuario?: string;
    prioridadDefecto?: string;
    fechaCreacion: string;
}

export const ticketService = {
    async getTickets(filter: TicketFilter = {}): Promise<TicketListResponse> {
        // Map frontend filters to backend query params
        const params: Record<string, string | number> = {};

        if (filter.view) params.view = filter.view;
        if (filter.search) params.search = filter.search;

        if (filter.status && filter.status !== 'All Statuses') {
            params.status = filter.status;
        }

        if (filter.priority && filter.priority !== 'All Priorities') {
            params.priority = filter.priority;
        }

        params.page = filter.page || 1;
        params.limit = filter.limit || 10;

        // NOTE: This endpoint is defined in API.md as GET /tickets/list
        const response = await api.get<{ data: RawTicket[], meta: TicketListResponse['meta'] }>('/tickets/list', { params });

        // Adapter: Map Backend/Spanish response to Frontend/English interface
        const rawData = response.data.data || [];
        const mappedTickets: Ticket[] = rawData.map((t: RawTicket) => ({
            id: t.id,
            subject: t.titulo,
            customer: t.creadorNombre || 'Unknown',
            customerInitials: (t.creadorNombre || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
            status: mapStatus(t.estado),
            priority: mapPriority(t.prioridadUsuario || t.prioridadDefecto || 'Media'),
            lastUpdated: new Date(t.fechaCreacion).toLocaleDateString() // Simple formatting
        }));

        return {
            data: mappedTickets,
            meta: response.data.meta || { total: mappedTickets.length, page: 1, limit: 10, totalPages: 1 }
        };
    },

    async createTicket(data: CreateTicketDto): Promise<Ticket> {
        const response = await api.post<RawTicket>('/tickets', data);
        const t = response.data;
        // Map single ticket response
        return {
            id: t.id,
            subject: t.titulo,
            customer: t.creadorNombre || 'Me', // When creating, it might not return creator name immediately
            customerInitials: 'ME',
            status: mapStatus(t.estado),
            priority: mapPriority(t.prioridadUsuario || 'Media'),
            lastUpdated: new Date().toLocaleDateString()
        };
    }
};

// Helper mappers
function mapStatus(estado: string): TicketStatus {
    const map: Record<string, TicketStatus> = {
        'Abierto': 'Open',
        'En Proceso': 'In Progress',
        'Pausado': 'In Progress', // Mapping Pausado to In Progress for now
        'Resuelto': 'Resolved',
        'Cerrado': 'Closed'
    };
    return map[estado] || 'Open';
}

function mapPriority(prioridad: string): TicketPriority {
    const map: Record<string, TicketPriority> = {
        'Alta': 'High',
        'Media': 'Medium',
        'Baja': 'Low',
        'Critica': 'High'
    };
    return map[prioridad] || 'Medium';
}
