export type TicketStatus = 'Abierto' | 'Pausado' | 'Cerrado';
export type TicketPriority = 'Alta' | 'Media' | 'Baja';

export interface Tag {
    id: number;
    name: string;
    color: string;
}

export interface Ticket {
    id: number;
    subject: string; // Asunto
    customer: string; // Nombre del cliente (calculado o relación)
    customerInitials: string; // Iniciales para el avatar
    status: TicketStatus;
    priority: TicketPriority;
    lastUpdated: string; // Fecha relativa o absoluta formataeda
    tags: Tag[];
}

export interface TicketFilter {
    view?: 'all' | 'created' | 'assigned' | 'observed' | 'history';
    search?: string;
    status?: TicketStatus | 'All Statuses';
    priority?: TicketPriority | 'All Priorities';
    page?: number;
    limit?: number;
    // Advanced Filters
    messageSearch?: string;
    creatorId?: number;
    companyId?: number;
    subcategoryId?: number;
    tagId?: number;
    dateFrom?: string;
    dateTo?: string;
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
    usuarioId?: number;
    titulo: string;
    descripcion: string;
    categoriaId: number;
    subcategoriaId: number;
    prioridadId?: number;
    empresaId?: number;
    usuarioAsignadoId?: number;
    initialTransitionKey?: string;
    initialTargetStepId?: number;
    templateValues?: { campoId: number; valor: string }[];
}

export interface UpdateTicketDto {
    titulo?: string;
    descripcion?: string;
    categoriaId?: number;
    prioridadId?: number;
    subcategoriaId?: number;
}

export interface TicketDetail extends Ticket {
    description: string;
    category: string;
    categoryId?: number; // Add ID for editing
    subcategory: string;
    subcategoryId?: number; // Add ID for editing
    createdDate: string; // ISO string
    creatorName: string;
    creatorId: number;
    workflowStep: string;
    workflowStepId: number;
    assignedTo?: string;
    assignedToId?: number;
    assignedToIds?: number[];
    priorityId?: number; // Add ID for editing
    isParallelStep?: boolean; // Indicates if current step is parallel
    stepRequiresSignature?: boolean;
    allowsClosing?: boolean;
    isForcedClose?: boolean;
}

export interface TicketTimelineItem {
    id: number;
    type: 'comment' | 'status_change' | 'assignment' | 'field_update' | 'creation' | 'error_report';
    content: string; // The comment or description of the event
    author: string;
    authorRole?: string;
    authorAvatar?: string; // URL or initials
    date: string; // ISO string
    metadata?: {
        oldStatus?: string;
        newStatus?: string;
        oldValue?: string;
        newValue?: string;
        fileUrl?: string;
        fileName?: string;
        attachments?: { id: number; nombre: string; url: string }[];
        estadoTiempoPaso?: string;
        error?: {
            id: number;
            title: string;
            description: string;
            isProcessError: boolean;
        };
    };
    asignadoA?: { id: number; nombre: string };
}

// --- WORKFLOW TYPES ---

export interface UserCandidate {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    cargo?: string;
}

export interface MissingRole {
    id: number;
    name: string;
    candidates: UserCandidate[];
    allowSkip: boolean;
}

export interface LinearTransition {
    targetStepId: number;
    targetStepName: string;
    requiresManualAssignment: boolean;
    candidates: UserCandidate[];
    missingRoles?: MissingRole[];
}

export interface DecisionOption {
    decisionId: string;
    label: string;
    targetStepId: number;
    requiresManualAssignment: boolean;
    candidates?: UserCandidate[];
    missingRoles?: MissingRole[];
    isRoute?: boolean;
}

export interface ParallelStatus {
    isBlocked: boolean;
    pendingTasks: any[];
}

export interface CheckNextStepResponse {
    transitionType: 'linear' | 'decision' | 'parallel_pending' | 'final';
    linear?: LinearTransition;
    decisions?: DecisionOption[];
    parallelStatus?: ParallelStatus;
}

export interface TransitionTicketDto {
    ticketId: number;
    transitionKeyOrStepId: string;
    comentario?: string;
    targetUserId?: number;
    templateValues?: TemplateFieldValue[];
    attachmentIds?: number[]; // IDs of uploaded files
    signature?: string; // base64
    manualAssignments?: Record<string, number>;
}

// Parallel Task Interfaces
export interface ParallelTask {
    id: number;
    ticketId: number;
    pasoId: number;
    usuarioId: number;
    estado: 'Pendiente' | 'Completado' | 'Aprobado';
    estadoTiempoPaso?: string;
    fechaCreacion?: string;
    fechaCierre?: string;
    comentario?: string;
    usuario?: {
        id: number;
        nombre: string;
        apellido: string;
        email: string;
    };
}

export interface SignParallelTaskDto {
    ticketId: number;
    comentario?: string;
    signature?: string;
}

export interface SignParallelTaskResponse {
    message: string;
    autoAdvanced: boolean;
    ticket?: any;
}

export interface TemplateField {
    id: number;
    nombre: string;
    codigo: string;
    tipo: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file' | 'regional' | 'cargo' | string;
    required: boolean;
    options?: string[]; // For select types
    campoQuery?: string;
    campoTrigger?: number;
}

export interface TemplateFieldValue {
    campoId: number;
    valor: string;
}

