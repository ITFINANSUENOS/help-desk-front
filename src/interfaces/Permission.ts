/**
 * Lista de acciones permitidas para los permisos.
 */
export const PERMISSION_ACTIONS = ['manage', 'create', 'read', 'update', 'delete'] as const;
export type PermissionAction = typeof PERMISSION_ACTIONS[number];

/**
 * Lista de entidades (subjects) sobre las que se aplican permisos.
 */
export const PERMISSION_SUBJECTS = [
    'User', 'Ticket', 'Category', 'Subcategoria', 'Department',
    'Role', 'Profile', 'Regional', 'Company', 'Permission',
    'Zone', 'Priority', 'Position', 'Rule', 'Report', 'all'
] as const;

export type PermissionSubject = typeof PERMISSION_SUBJECTS[number];

/**
 * Representa la definición de un permiso en el catálogo del sistema.
 */
export interface Permission {
    id: number;
    nombre: string;
    action: PermissionAction;
    subject: PermissionSubject;
    descripcion: string;
}

/**
 * DTO para crear o definir un nuevo permiso.
 */
export interface CreatePermissionDto {
    nombre: string;
    action: string;
    subject: string;
    descripcion?: string;
}
