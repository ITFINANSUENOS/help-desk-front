import { api } from './api';
import type { Role, CreateRoleDto, UpdateRoleDto } from '../interfaces/Role';
import type { Permission, CreatePermissionDto } from '../interfaces/Permission';

/**
 * Service for handling Role-Based Access Control (RBAC) operations.
 */
export const rbacService = {
    // 1. Gestión de Roles
    async getRoles(params?: { page?: number; limit?: number; search?: string }): Promise<Role[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.get<any>('/roles', { params });
        if (Array.isArray(response.data)) return response.data;
        return response.data?.data || [];
    },

    async getRole(id: number): Promise<Role> {
        const response = await api.get<Role>(`/roles/${id}`);
        return response.data;
    },

    async createRole(data: CreateRoleDto): Promise<Role> {
        const response = await api.post<Role>('/roles', data);
        return response.data;
    },

    async updateRole(id: number, data: UpdateRoleDto): Promise<Role> {
        const response = await api.put<Role>(`/roles/${id}`, data);
        return response.data;
    },

    async deleteRole(id: number): Promise<void> {
        await api.delete(`/roles/${id}`);
    },

    // 2. Asignación de Permisos a Roles
    async getRolePermissions(roleId: number): Promise<Permission[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.get<any>(`/permissions/role/${roleId}`);
        if (Array.isArray(response.data)) return response.data;
        return response.data?.data || [];
    },

    async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
        await api.put(`/permissions/role/${roleId}`, { permisoIds: permissionIds });
    },

    // 3. Gestión de Definiciones de Permisos (Catálogo)
    async getPermissions(): Promise<Permission[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.get<any>('/permissions');
        if (Array.isArray(response.data)) return response.data;
        return response.data?.data || [];
    },

    async createPermission(data: CreatePermissionDto): Promise<Permission> {
        const response = await api.post<Permission>('/permissions', data);
        return response.data;
    },

    async updatePermission(id: number, data: Partial<CreatePermissionDto>): Promise<Permission> {
        const response = await api.put<Permission>(`/permissions/${id}`, data);
        return response.data;
    },

    async deletePermission(id: number): Promise<void> {
        await api.delete(`/permissions/${id}`);
    }
};
