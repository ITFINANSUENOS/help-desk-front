import { api } from '../../../core/api/api';
import type { Ticket, TicketFilter, TicketListResponse, CreateTicketDto, UpdateTicketDto, TicketStatus, TicketPriority, TicketDetail, TicketTimelineItem, CheckNextStepResponse, TransitionTicketDto } from '../interfaces/Ticket';

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
    usuariosAsignados?: RawUser[];

    // Legacy/List fields fallback (if list endpoint uses different structure)
    creadorNombre?: string;
    estado?: string;
    prioridadUsuario?: string;
    prioridadDefecto?: string;
}

interface RawAttachment {
    id: number;
    nombre: string;
    url: string;
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
    adjuntos?: RawAttachment[];
    asignadoA?: { id: number; nombre: string }; // New field
}

export const ticketService = {
    async getTickets(filter: TicketFilter = {}): Promise<TicketListResponse> {
        // ... existing code ...
        // Map frontend filters to backend query params
        const params: Record<string, string | number> = {};
        if (filter.view) params.view = filter.view;
        if (filter.search) params.search = filter.search;
        if (filter.status) params.status = filter.status;
        if (filter.priority) params.priority = filter.priority;
        params.page = filter.page || 1;
        params.limit = filter.limit || 10;
        const response = await api.get<any>('/tickets/list', { params });
        const rawData = response.data.data || [];
        const mappedTickets: Ticket[] = rawData.map((t: RawTicket) => ({
            id: t.id,
            subject: t.titulo,
            customer: t.creadorNombre || (t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : 'Unknown'),
            customerInitials: (t.creadorNombre || (t.usuario ? `${t.usuario.nombre}` : 'U')).split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
            status: mapStatus(t.ticketEstado || t.estado || 'Abierto'),
            priority: mapPriority(t.prioridad ? t.prioridad.nombre : (t.prioridadUsuario || 'Media')),
            lastUpdated: new Date(t.fechaCreacion).toLocaleDateString()
        }));
        const total = response.data.total ?? response.data.meta?.total ?? mappedTickets.length;
        const page = response.data.page ?? response.data.meta?.page ?? 1;
        const limit = response.data.limit ?? response.data.meta?.limit ?? 10;
        const totalPages = response.data.totalPages ?? response.data.meta?.totalPages ?? Math.ceil(total / limit);
        return {
            data: mappedTickets,
            meta: { total, page, limit, totalPages }
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
            status: mapStatus(t.ticketEstado || t.estado || 'Abierto'),
            priority: mapPriority('Media'),
            lastUpdated: new Date().toLocaleDateString()
        };
    },
    async updateTicket(id: number, data: UpdateTicketDto): Promise<void> {
        await api.put(`/tickets/${id}`, data);
    },
    async getTicket(id: number): Promise<TicketDetail> {
        const response = await api.get<RawTicket>(`/tickets/${id}`);
        const t = response.data;
        const customerName = t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : (t.creadorNombre || 'Unknown');
        const categoryName = t.categoria ? t.categoria.nombre : 'General';
        const subcategoryName = t.subcategoria ? t.subcategoria.nombre : '';
        const priorityName = t.prioridad ? t.prioridad.nombre : (t.prioridadUsuario || 'Media');
        const stepName = t.pasoActual ? t.pasoActual.nombre : 'Procesamiento';
        const stepId = t.pasoActual ? t.pasoActual.id : 0;

        let assignedToName = 'Sin Asignar';
        if (t.usuariosAsignados && t.usuariosAsignados.length > 0) {
            assignedToName = `${t.usuariosAsignados[0].nombre} ${t.usuariosAsignados[0].apellido}`;
        } else if (t.usuarioAsignadoIds && t.usuarioAsignadoIds.length > 0) {
            assignedToName = `Usuario (ID: ${t.usuarioAsignadoIds[0]})`;
        }

        return {
            id: t.id,
            subject: t.titulo,
            customer: customerName,
            customerInitials: customerName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
            status: mapStatus(t.ticketEstado || t.estado),
            priority: mapPriority(priorityName),
            lastUpdated: new Date(t.fechaCreacion).toLocaleDateString(),
            description: t.descripcion || '',
            category: categoryName,
            categoryId: t.categoria?.id,
            subcategory: subcategoryName,
            subcategoryId: t.subcategoria?.id,
            createdDate: t.fechaCreacion,
            creatorName: customerName,
            creatorId: t.usuario?.id || 0,
            workflowStep: stepName,
            workflowStepId: stepId,
            assignedTo: assignedToName,
            assignedToId: (t.usuarioAsignadoIds && t.usuarioAsignadoIds.length > 0) ? t.usuarioAsignadoIds[0] : 0,
            assignedToIds: t.usuarioAsignadoIds || [],
            priorityId: t.prioridad?.id
        };
    },
    async getTicketTimeline(id: number): Promise<TicketTimelineItem[]> {
        const response = await api.get<RawTimelineItem[]>(`/tickets/${id}/history`);
        console.log('Raw Timeline Data:', response.data);
        return response.data.map((item, index) => {
            const authorName = item.actor?.nombre || item.autor || 'Unknown';
            const content = item.descripcion || item.contenido || '';
            const rawType = item.type || item.tipo || 'comment';
            return {
                id: item.id || index,
                type: mapTimelineType(rawType),
                content: content,
                author: authorName,
                authorRole: item.autorRol,
                authorAvatar: authorName.substring(0, 2).toUpperCase(),
                date: item.fecha,
                metadata: {
                    ...item.metadata,
                    attachments: item.adjuntos
                },
                asignadoA: item.asignadoA // Map the new field
            };
        });
    },

    // --- WORKFLOW METHODS ---

    async checkNextStep(ticketId: number): Promise<CheckNextStepResponse> {
        const response = await api.get<CheckNextStepResponse>(`/workflows/check-next-step/${ticketId}`);
        return response.data;
    },

    async transitionTicket(dto: TransitionTicketDto): Promise<void> {
        await api.post('/workflows/transition', dto);
    },

    async getTicketMasterPdf(ticketId: number): Promise<Blob> {
        const response = await api.get(`/documents/ticket/${ticketId}/master-pdf`, {
            responseType: 'blob'
        });
        return response.data;
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
