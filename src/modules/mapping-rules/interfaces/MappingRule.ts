import type { Subcategory } from '../../subcategories/interfaces/Subcategory';
import type { Position } from '../../positions/interfaces/Position';
import type { Profile } from '../../profiles/interfaces/Profile';

/**
 * Entidad ReglaCreadores (Cargo creador)
 */
export interface ReglaCreadores {
    /** ID único */
    id: number;
    /** ID de la regla de mapeo */
    reglaId: number;
    /** ID del cargo creador */
    creadorCargoId: number;
    /** Relación con el cargo */
    cargo?: Position;
    /** Index signature para compatibilidad */
    [key: string]: unknown;
}


/**
 * Entidad ReglaCreadoresPerfil (Perfil creador)
 */
export interface ReglaCreadoresPerfil {
    /** ID único */
    id: number;
    /** ID de la regla de mapeo */
    reglaId: number;
    /** ID del perfil creador */
    creadorPerfilId: number;
    /** Relación con el perfil */
    perfil?: Profile;
    /** Index signature para compatibilidad */
    [key: string]: unknown;
}


/**
 * Entidad ReglaAsignados (Cargo asignado)
 */
export interface ReglaAsignados {
    /** ID único */
    id: number;
    /** ID de la regla de mapeo */
    reglaId: number;
    /** ID del cargo asignado */
    asignadoCargoId: number;
    /** Relación con el cargo */
    cargo?: Position;
    /** Index signature para compatibilidad */
    [key: string]: unknown;
}


/**
 * Entidad MappingRule (Regla de Mapeo)
 */
export interface MappingRule {
    /** ID único de la regla */
    id: number;
    /** ID de la subcategoría asociada */
    subcategoriaId: number;
    /** Estado de la regla (1=activo, 0=inactivo) */
    estado: number;
    /** Relación con la subcategoría */
    subcategoria?: Subcategory;
    /** Cargos creadores */
    creadores?: ReglaCreadores[];
    /** Perfiles creadores */
    creadoresPerfil?: ReglaCreadoresPerfil[];
    /** Cargos asignados */
    asignados?: ReglaAsignados[];
    /** Index signature para compatibilidad */
    [key: string]: unknown;
}

/**
 * DTO para crear una regla de mapeo
 */
export interface CreateMappingRuleDto {
    /** ID de la subcategoría (requerido) */
    subcategoriaId: number;
    /** IDs de cargos creadores (opcional) */
    creadorCargoIds?: number[];
    /** IDs de perfiles creadores (opcional) */
    creadorPerfilIds?: number[];
    /** IDs de cargos asignados (opcional) */
    asignadoCargoIds?: number[];
    /** Estado (opcional, default 1) */
    estado?: number;
}

/**
 * DTO para actualizar una regla de mapeo
 */
export interface UpdateMappingRuleDto {
    /** ID de la subcategoría */
    subcategoriaId?: number;
    /** IDs de cargos creadores */
    creadorCargoIds?: number[];
    /** IDs de perfiles creadores */
    creadorPerfilIds?: number[];
    /** IDs de cargos asignados */
    asignadoCargoIds?: number[];
    /** Estado */
    estado?: number;
}

/**
 * Filtros para listar reglas de mapeo
 */
export interface MappingRuleFilter {
    /** Búsqueda por nombre de subcategoría */
    search?: string;
    /** Filtrar por estado */
    estado?: number | 'all';
    /** Filtrar por subcategoría */
    subcategoriaId?: number | 'all';

    // Paginación
    page?: number;
    limit?: number;
}
