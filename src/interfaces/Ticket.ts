export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'High' | 'Medium' | 'Low';

export interface Ticket {
    id: number;
    subject: string; // Asunto
    customer: string; // Nombre del cliente (calculado o relación)
    customerInitials: string; // Iniciales para el avatar
    status: TicketStatus;
    priority: TicketPriority;
    lastUpdated: string; // Fecha relativa o absoluta formataeda
}

export interface TicketFilter {
    view?: 'all' | 'created' | 'assigned' | 'observed';
    search?: string;
    status?: TicketStatus | 'All Statuses';
    priority?: TicketPriority | 'All Priorities';
    page?: number;
    limit?: number;
}

export interface TicketListResponse {
    data: Ticket[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateTicketDto {
    titulo: string;
    descripcion: string;
    categoriaId: number;
    prioridadId?: number;
    subcategoriaId?: number;
}
