/**
 * Metadata de paginación estándar de la API
 */
export interface PaginationMeta {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    totalPages: number; // A veces viene como lastPage o totalPages, aseguramos compatibilidad
}

/**
 * Respuesta genérica paginada
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
