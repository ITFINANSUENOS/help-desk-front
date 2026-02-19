export interface Workflow {
    id: number;
    nombre: string;
    descripcion?: string;
    subcategoriaId: number;
    estado: number; // 1 = Activo, 0 = Inactivo
    nombreAdjunto?: string;
    subcategoria?: {
        id: number;
        nombre: string;
    };
    observadoresIds?: number[]; // IDs of observer users
    usuariosObservadores?: Array<{ // Full observer objects
        id: number;
        nombre: string;
        apellido: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateWorkflowDto {
    nombre: string;
    subcategoriaId: number;
    nombreAdjunto?: string;
    observadoresIds?: number[];
}

export interface UpdateWorkflowDto {
    nombre?: string;
    subcategoriaId?: number;
    estado?: number;
    nombreAdjunto?: string;
    observadoresIds?: number[];
}

export interface WorkflowFilter {
    search?: string;
    estado?: number | 'all';
    page?: number;
    limit?: number;
}

export interface WorkflowListResponse {
    data: Workflow[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
