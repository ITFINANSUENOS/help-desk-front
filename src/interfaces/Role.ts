/**
 * Representa un Rol en el sistema RBAC.
 */
export interface Role {
    id: number;
    nombre: string;
    descripcion: string;
    estado: number;
}

/**
 * DTO para crear un nuevo rol.
 */
export interface CreateRoleDto {
    nombre: string;
    descripcion: string;
}

/**
 * DTO para actualizar un rol existente (parcial).
 */
export interface UpdateRoleDto {
    nombre?: string;
    descripcion?: string;
    estado?: number;
}
