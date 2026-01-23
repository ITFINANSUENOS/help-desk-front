import type { Category } from '../../categories/interfaces/Category';
import type { Priority } from '../../tickets/interfaces/Priority';

export interface Subcategory {
    id: number;
    categoriaId: number;
    prioridadId: number | null;
    nombre: string;
    descripcion: string | null;
    estado: number; // 1=active, 0=inactive

    // Relations
    categoria?: Category;
    prioridad?: Priority;
}

export interface CreateSubcategoryDto {
    categoriaId: number;
    prioridadId?: number;
    nombre: string;
    descripcion?: string;
    estado?: number;
}

export interface UpdateSubcategoryDto {
    categoriaId?: number;
    prioridadId?: number;
    nombre?: string;
    descripcion?: string;
    estado?: number;
}

export interface SubcategoryFilter {
    search?: string;
    estado?: number | 'all';
    categoriaId?: number | 'all';
    page?: number;
    limit?: number;
}

export interface SubcategoryListResponse {
    data: Subcategory[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
