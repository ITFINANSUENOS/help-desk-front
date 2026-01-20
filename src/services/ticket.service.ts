import { api } from './api';
import type { Ticket, TicketFilter, TicketListResponse, CreateTicketDto, TicketStatus, TicketPriority, TicketDetail, TicketTimelineItem } from '../interfaces/Ticket';

// Interface for the raw backend response (Spanish fields)
interface RawUser {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    // ... add more if needed
}

interface RawCategory {
    id: number;
    nombre: string;
    descripcion?: string;
    // ...
}

interface RawSubcategory {
    id: number;
    nombre: string;
    // ...
}

interface RawPriority {
    id: number;
    nombre: string;
    // ...
}

interface RawWorkflowStep {
    id: number;
    nombre: string;
    descripcion: string;
    // ...
}

interface RawTicket {
    id: number;
    titulo: string;
    descripcion: string;
    ticketEstado: string; // "Abierto"
    errorProceso: number;
    fechaCreacion: string;

    // Nested objects
    usuario?: RawUser;
    categoria?: RawCategory;
    subcategoria?: RawSubcategory;
    prioridad?: RawPriority;
    pasoActual?: RawWorkflowStep;

    usuarioAsignadoIds?: number[];

    // Legacy/List fields fallback (if list endpoint uses different structure)
    creadorNombre?: string;
    estado?: string;
    prioridadUsuario?: string;
    prioridadDefecto?: string;
}

interface RawTimelineItem {
    id?: number;
    actor?: { id: number; nombre: string };
    autor?: string;
    autorRol?: string;

    descripcion?: string;
    contenido?: string;

    type?: string;
    tipo?: string;

    fecha: string;
    metadata?: Record<string, unknown>;
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
        // IMPORTANT: We need to handle potential differences between List and Detail DTOs.
        // For now, we assume List might still return flatter structure or we map carefully.
        // To satisfy lint, we define a loose shape for list items or reuse RawTicket if we are confident.
        // Given we don't have list JSON, we'll try to use a union or Partial<RawTicket> but 'any' was flagged.
        // Let's use a temporary interface locally or just safely cast.

        const response = await api.get<{ data: RawTicket[], meta: TicketListResponse['meta'] }>('/tickets/list', { params });

        const rawData = response.data.data || [];
        const mappedTickets: Ticket[] = rawData.map((t: RawTicket) => ({
            id: t.id,
            subject: t.titulo,
            customer: t.creadorNombre || (t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : 'Unknown'),
            customerInitials: (t.creadorNombre || (t.usuario ? `${t.usuario.nombre}` : 'U')).split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
            // Map status. The backend might return 'ticketEstado' OR 'estado' (int or string).
            status: mapStatus(t.ticketEstado || t.estado || 'Abierto'),
            // Map priority.
            priority: mapPriority(t.prioridad ? t.prioridad.nombre : (t.prioridadUsuario || 'Media')),
            lastUpdated: new Date(t.fechaCreacion).toLocaleDateString()
        }));

        return {
            data: mappedTickets,
            meta: response.data.meta || { total: mappedTickets.length, page: 1, limit: 10, totalPages: 1 }
        };
    },

    async createTicket(data: CreateTicketDto): Promise<Ticket> {
        const response = await api.post<RawTicket>('/tickets', data);
        const t = response.data;
        return {
            id: t.id,
            subject: t.titulo,
            customer: 'Me',
            customerInitials: 'ME',
            status: mapStatus(t.ticketEstado || t.estado || 'Abierto'), // Fallback
            priority: mapPriority('Media'), // Backend usually sets default
            lastUpdated: new Date().toLocaleDateString()
        };
    },

    async getTicket(id: number): Promise<TicketDetail> {
        const response = await api.get<RawTicket>(`/tickets/${id}`);
        const t = response.data;

        // Safe access helpers in case of nulls
        const customerName = t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : (t.creadorNombre || 'Unknown');
        const categoryName = t.categoria ? t.categoria.nombre : 'General';
        const subcategoryName = t.subcategoria ? t.subcategoria.nombre : '';
        const priorityName = t.prioridad ? t.prioridad.nombre : (t.prioridadUsuario || 'Media');
        const stepName = t.pasoActual ? t.pasoActual.nombre : 'Procesamiento';
        const stepId = t.pasoActual ? t.pasoActual.id : 0;

        return {
            id: t.id,
            subject: t.titulo,
            customer: customerName,
            customerInitials: customerName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
            status: mapStatus(t.ticketEstado || t.estado),
            priority: mapPriority(priorityName),
            lastUpdated: new Date(t.fechaCreacion).toLocaleDateString(),

            // Detail specific
            description: t.descripcion || '',
            category: categoryName,
            subcategory: subcategoryName,
            createdDate: t.fechaCreacion,
            creatorName: customerName,
            workflowStep: stepName,
            workflowStepId: stepId,
            assignedTo: 'Unknown', // Not explicitly in JSON top level
            assignedToId: (t.usuarioAsignadoIds && t.usuarioAsignadoIds.length > 0) ? t.usuarioAsignadoIds[0] : 0
        };
    },

    async getTicketTimeline(id: number): Promise<TicketTimelineItem[]> {
        const response = await api.get<RawTimelineItem[]>(`/tickets/${id}/timeline`);
        console.log('Raw Timeline Data:', response.data);
        return response.data.map((item, index) => {
            // Determine author name
            const authorName = item.actor?.nombre || item.autor || 'Unknown';

            // Determine content
            const content = item.descripcion || item.contenido || '';

            // Determine type
            const rawType = item.type || item.tipo || 'comment';

            return {
                id: item.id || index,
                type: mapTimelineType(rawType),
                content: content,
                author: authorName,
                authorRole: item.autorRol, // This might be missing in new response, check logic later
                authorAvatar: authorName.substring(0, 2).toUpperCase(),
                date: item.fecha,
                metadata: item.metadata
            };
        });
    }
};

// Helper mappers
function mapStatus(estado: string | number | undefined): TicketStatus {
    // If it's a number, map it to a string if we knew the mapping. 
    // For now, default to Abierto if unknown.
    if (typeof estado === 'number') {
        const statusMap: Record<number, TicketStatus> = {
            1: 'Abierto',
            2: 'Pausado',
            3: 'Cerrado'
            // Add other numeric maps if discovered
        };
        return statusMap[estado] || 'Abierto';
    }

    if (!estado) return 'Abierto';

    // Normalize string
    const valid: TicketStatus[] = ['Abierto', 'Pausado', 'Cerrado'];
    if (valid.includes(estado as TicketStatus)) {
        return estado as TicketStatus;
    }

    // Map legacy or English status to new Spanish types
    const map: Record<string, TicketStatus> = {
        'Open': 'Abierto',
        'Abierto': 'Abierto',
        'In Progress': 'Pausado', // Mapping "In Progress" to "Pausado" as per user request/code? Or "Abierto"? User used "Pausado".
        'En Proceso': 'Pausado',
        'Pausado': 'Pausado',
        'Resolved': 'Cerrado',
        'Resuelto': 'Cerrado',
        'Closed': 'Cerrado',
        'Cerrado': 'Cerrado'
    };
    return map[estado] || 'Abierto';
}

function mapPriority(prioridad: string): TicketPriority {
    if (!prioridad) return 'Media';

    const valid: TicketPriority[] = ['Alta', 'Media', 'Baja'];
    if (valid.includes(prioridad as TicketPriority)) {
        return prioridad as TicketPriority;
    }

    const map: Record<string, TicketPriority> = {
        'High': 'Alta',
        'Alta': 'Alta',
        'Critica': 'Alta',
        'Medium': 'Media',
        'Media': 'Media',
        'Low': 'Baja',
        'Baja': 'Baja'
    };
    return map[prioridad] || 'Media';
}

function mapTimelineType(tipo: string): TicketTimelineItem['type'] {
    if (!tipo) return 'comment';
    const normalize = tipo.toLowerCase();
    const map: Record<string, TicketTimelineItem['type']> = {
        'comentario': 'comment',
        'comment': 'comment',
        'asignacion': 'assignment',
        'assignment': 'assignment',
        'estado': 'status_change',
        'status_change': 'status_change',
        'sistema': 'field_update',
        'apertura': 'creation',
        'created': 'creation'
    };
    return map[normalize] || 'comment';
}
