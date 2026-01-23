/**
 * Entidad Department (Departamento)
 */
export interface Department {
    /** ID único del departamento */
    id: number;
    /** Nombre del departamento */
    nombre: string;
    /** Estado del departamento (1=activo, 0=inactivo) */
    estado: number;
    /** Fecha de creación */
    fechaCreacion?: Date;
    /** Index signature para compatibilidad con useCrud */
    [key: string]: unknown;
}

/**
 * DTO para crear un departamento
 */
export interface CreateDepartmentDto {
    /** Nombre del departamento */
    nombre: string;
    /** Estado del departamento (opcional, por defecto 1) */
    estado?: number;
}

/**
 * DTO para actualizar un departamento
 */
export interface UpdateDepartmentDto {
    /** Nombre del departamento */
    nombre?: string;
    /** Estado del departamento */
    estado?: number;
}

/**
 * Filtros para listar departamentos
 */
export interface DepartmentFilter {
    /** Búsqueda por nombre */
    search?: string;
    /** Filtrar por estado */
    estado?: number | 'all';

    // Paginación
    page?: number;
    limit?: number;
}
