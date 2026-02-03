import { api } from '../../../core/api/api';
import type { Ticket, TicketFilter, TicketListResponse, CreateTicketDto, UpdateTicketDto, TicketStatus, TicketPriority, TicketDetail, TicketTimelineItem, CheckNextStepResponse, TransitionTicketDto, ParallelTask, SignParallelTaskDto, SignParallelTaskResponse } from '../interfaces/Ticket';

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
    esParalelo?: boolean;
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
    etiquetas?: { id?: number; nombre: string; color: string }[];
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
    documentos?: RawAttachment[];
    asignadoA?: { id: number; nombre: string }; // New field
}

export const ticketService = {
    async getTickets(filter: TicketFilter = {}): Promise<TicketListResponse> {
        // ... existing code ...
        // Map frontend filters to backend query params
        // Map frontend filters to backend query params
        const params: Record<string, string | number | undefined> = {
            page: filter.page || 1,
            limit: filter.limit || 10,
            ...filter // Spread all other filters (companyId, tagId, etc.)
        };

        // Ensure specific mappings if needed (though spread handles most)
        // If view/status/priority are undefined in filter, they won't be in params or will be undefined.
        // Limpiar parámetros (remover undefined, null, strings vacíos y NaN)
        const cleanParams = Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object.entries(params).filter(([_, v]) => {
                if (v === undefined || v === null || v === '') return false;
                if (typeof v === 'number' && isNaN(v)) return false;
                return true;
            })
        );

        const response = await api.get<any>('/tickets/list', { params: cleanParams });
        const rawData = response.data.data || [];
        const mappedTickets: Ticket[] = rawData.map((t: RawTicket) => ({
            id: t.id,
            subject: t.titulo,
            customer: t.creadorNombre || (t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : 'Unknown'),
            customerInitials: (t.creadorNombre || (t.usuario ? `${t.usuario.nombre}` : 'U')).split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
            status: mapStatus(t.ticketEstado || t.estado || 'Abierto'),
            priority: mapPriority(t.prioridad ? t.prioridad.nombre : (t.prioridadUsuario || 'Media')),
            lastUpdated: new Date(t.fechaCreacion).toLocaleDateString(),
            tags: (t.etiquetas || []).map(e => ({ id: e.id || 0, name: e.nombre, color: e.color }))
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
    async createTicket(data: CreateTicketDto, files: File[] = []): Promise<Ticket> {
        let payload: any = data;
        let headers = {};

        if (files.length > 0) {
            const formData = new FormData();
            // Append all DTO fields
            Object.keys(data).forEach(key => {
                const value = (data as any)[key];
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value) || typeof value === 'object') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            // Append files
            files.forEach(file => {
                formData.append('files', file);
            });
            payload = formData;
            headers = { 'Content-Type': 'multipart/form-data' };
        }

        const response = await api.post<RawTicket>('/tickets', payload, { headers });
        const t = response.data;
        return {
            id: t.id,
            subject: t.titulo,
            customer: 'Me',
            customerInitials: 'ME',
            status: mapStatus(t.ticketEstado || t.estado || 'Abierto'),
            priority: mapPriority('Media'),
            lastUpdated: new Date().toLocaleDateString(),
            tags: []
        };
    },
    async updateTicket(id: number, data: UpdateTicketDto): Promise<void> {
        await api.put(`/tickets/${id}`, data);
    },
    async getTicket(id: number): Promise<TicketDetail> {
        const response = await api.get<RawTicket>(`/tickets/${id}`);
        const t = response.data;

        console.log('🔍 RAW TICKET DATA:', t);
        console.log('🔍 Paso Actual:', t.pasoActual);
        console.log('🔍 Es Paralelo Raw:', t.pasoActual?.esParalelo);

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
            priorityId: t.prioridad?.id,
            isParallelStep: t.pasoActual?.esParalelo || false,
            tags: (t.etiquetas || []).map(e => ({ id: e.id || 0, name: e.nombre, color: e.color }))
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
                    attachments: item.documentos || item.adjuntos || []
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

    async getWorkflowGraph(subcategoryId: number): Promise<any> {
        // Fetch the active flow for the subcategory, including steps and routes
        const response = await api.get<any>('/workflows', {
            params: {
                'filter[subcategoria.id]': subcategoryId,
                'included': [
                    'pasos',
                    'pasos.transicionesOrigen',
                    'pasos.transicionesOrigen.pasoDestino',
                    'rutas',
                    'rutas.rutaPasos',
                    'rutas.rutaPasos.paso',
                    'rutas.rutaPasos.paso.transicionesOrigen',
                    'rutas.rutaPasos.paso.transicionesOrigen.pasoDestino'
                ].join(',')
            }
        });
        // Assuming the list returns items in `data`. 
        // We take the first one since subcategory <-> flow is 1:1 (or we want the active one).
        const flows = response.data.data || [];
        return flows.length > 0 ? flows[0] : null;
    },

    async transitionTicket(dto: TransitionTicketDto, files: File[] = []): Promise<any> {
        let payload: any = dto;
        let headers = {};

        if (files.length > 0) {
            const formData = new FormData();
            Object.keys(dto).forEach(key => {
                const value = (dto as any)[key];
                if (value !== undefined && value !== null) {
                    if (key === 'manualAssignments' || key === 'templateValues') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            files.forEach(file => {
                formData.append('files', file);
            });
            payload = formData;
            headers = { 'Content-Type': 'multipart/form-data' };
        }

        const response = await api.post('/workflows/transition', payload, { headers });
        return response.data;
    },

    async getParallelTasks(ticketId: number): Promise<ParallelTask[]> {
        const response = await api.get(`/tickets/${ticketId}/parallel-tasks`);
        return response.data;
    },

    async signParallelTask(dto: SignParallelTaskDto): Promise<SignParallelTaskResponse> {
        const response = await api.post('/workflows/sign-parallel-task', dto);
        return response.data;
    },

    async getTicketMasterPdf(ticketId: number): Promise<Blob> {
        const response = await api.get(`/documents/ticket/${ticketId}/master-pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    async getErrorTypes(): Promise<ErrorType[]> {
        const response = await api.get<{ data: ErrorType[] }>('/error-types', {
            params: { included: 'subtypes' }
        });
        return response.data.data || [];
    },

    async registerErrorEvent(ticketId: number, data: { errorTypeId: number; errorSubtypeId?: number; description?: string }): Promise<void> {
        await api.post(`/tickets/${ticketId}/events`, data);
    },

    async createNovelty(ticketId: number, data: { usuarioAsignadoId: number; descripcion: string }, files: File[] = []): Promise<void> {
        let payload: any = data;
        let headers = {};

        if (files.length > 0) {
            const formData = new FormData();
            formData.append('usuarioAsignadoId', String(data.usuarioAsignadoId));
            formData.append('descripcion', data.descripcion);
            files.forEach(file => {
                formData.append('files', file);
            });
            payload = formData;
            headers = { 'Content-Type': 'multipart/form-data' };
        }

        await api.post(`/tickets/${ticketId}/novelties`, payload, { headers });
    },

    async resolveNovelty(ticketId: number, files: File[] = []): Promise<void> {
        let payload: any = {};
        let headers = {};

        if (files.length > 0) {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            payload = formData;
            headers = { 'Content-Type': 'multipart/form-data' };
        }

        await api.put(`/tickets/${ticketId}/novelties/resolve`, payload, { headers });
    },

    async closeTicket(id: number, comentario: string, files: File[] = []): Promise<void> {
        let payload: any = { comentario };
        let headers = {};

        if (files.length > 0) {
            const formData = new FormData();
            formData.append('comentario', comentario);
            files.forEach(file => {
                formData.append('files', file);
            });
            payload = formData;
            headers = { 'Content-Type': 'multipart/form-data' };
        }

        await api.post(`/tickets/${id}/close`, payload, { headers });
    },

    async addTag(ticketId: number, tagId: number): Promise<void> {
        await api.post(`/tickets/${ticketId}/tags`, { tagId });
    },

    async removeTag(ticketId: number, tagId: number): Promise<void> {
        await api.delete(`/tickets/${ticketId}/tags/${tagId}`);
    },

    async downloadFile(url: string, filename: string): Promise<void> {
        // If the URL is absolute, api.get should handle it.
        const response = await api.get(url, { responseType: 'blob' });
        const mimeType = response.headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([response.data], { type: mimeType });
        const blobUrl = window.URL.createObjectURL(blob);

        const isViewable = mimeType.includes('pdf') || mimeType.includes('image');

        if (isViewable) {
            window.open(blobUrl, '_blank');
            // Clean up later (browser handles it mostly for new tabs, but good practice to revoke if SPA)
            // setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000); 
        } else {
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        }
    }
};
export interface ErrorSubtype {
    id: number;
    title: string;
    description: string;
}

export interface ErrorType {
    id: number;
    title: string;
    description: string;
    category: number; // 0=Info, 1=Process
    subtypes?: ErrorSubtype[];
}

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
        'created': 'creation',
        'creation': 'creation'
    };
    return map[normalize] || 'comment';
}
