import type { Department } from '../../departments/interfaces/Department';
import type { Company } from '../../tickets/interfaces/Company';

/**
 * Entidad Category (Categoría)
 */
export interface Category {
    /** ID único de la categoría */
    id: number;
    /** Nombre de la categoría */
    nombre: string;
    /** Estado de la categoría (1=activo, 0=inactivo) */
    estado: number;
    /** Departamentos asociados */
    departamentos?: Department[];
    /** Empresas asociadas */
    empresas?: Company[];
    /** Index signature para compatibilidad */
    [key: string]: unknown;
}

/**
 * DTO para crear una categoría
 */
export interface CreateCategoryDto {
    /** Nombre de la categoría */
    nombre: string;
    /** Estado (opcional, default 1) */
    estado?: number;
    /** IDs de departamentos asociados */
    departamentoIds: number[];
    /** IDs de empresas asociadas */
    empresaIds: number[];
}

/**
 * DTO para actualizar una categoría
 */
export interface UpdateCategoryDto {
    /** Nombre de la categoría */
    nombre?: string;
    /** Estado */
    estado?: number;
    /** IDs de departamentos para actualizar relaciones */
    departamentoIds?: number[];
    /** IDs de empresas para actualizar relaciones */
    empresaIds?: number[];
}

/**
 * Filtros para listar categorías
 */
export interface CategoryFilter {
    /** Búsqueda por nombre */
    search?: string;
    /** Filtrar por estado */
    estado?: number | 'all';
    /** Filtrar por departamento asociado */
    departamentoId?: number | 'all';

    // Paginación
    page?: number;
    limit?: number;
}
