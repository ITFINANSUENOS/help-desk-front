export const PERMISSION_ACTIONS = ['manage', 'create', 'read', 'update', 'delete'] as const;
export type PermissionAction = typeof PERMISSION_ACTIONS[number];

export const PERMISSION_SUBJECTS = [
    'User', 'Ticket', 'Category', 'Subcategoria', 'Department',
    'Role', 'Profile', 'Regional', 'Company', 'Permission',
    'Zone', 'Priority', 'Position', 'Rule', 'Report', 'all'
] as const;

export type PermissionSubject = typeof PERMISSION_SUBJECTS[number];

/**
 * Represents a single permission definition in the system.
 */
export interface Permission {
    id: number;
    action: PermissionAction;
    subject: PermissionSubject;
    descripcion: string;
}

export interface CreatePermissionDto {
    action: string;
    subject: string;
    descripcion?: string;
}
