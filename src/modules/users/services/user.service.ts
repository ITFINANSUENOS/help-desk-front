import { api } from '../../../core/api/api';
import type { User, UserFilter, UserListResponse, CreateUserDto, UpdateUserDto } from '../interfaces/User';

export const userService = {
    async getUsers(filter: UserFilter = {}): Promise<UserListResponse> {
        const params: Record<string, string | number> = {};

        // Pagination
        params.page = filter.page || 1;
        params.limit = filter.limit || 10;

        // Filters
        if (filter.search) {
            // Search in multiple fields (backend should handle this)
            params['filter[search]'] = filter.search;
        }

        if (filter.rolId && filter.rolId !== 'all') {
            params['filter[rolId]'] = filter.rolId;
        }

        if (filter.cargoId && filter.cargoId !== 'all') {
            params['filter[cargoId]'] = filter.cargoId;
        }

        if (filter.regionalId && filter.regionalId !== 'all') {
            params['filter[regionalId]'] = filter.regionalId;
        }

        if (filter.estado !== undefined && filter.estado !== 'all') {
            params['filter[estado]'] = filter.estado;
        }

        // Include relations
        params.included = 'role,regional,cargo,departamento';

        const response = await api.get<{ data?: User[]; total?: number; page?: number; limit?: number; totalPages?: number; meta?: { total: number; page: number; limit: number; totalPages: number } }>('/users', { params });

        // Handle pagination metadata
        const data: User[] = response.data.data || (Array.isArray(response.data) ? response.data : []);
        const total = response.data.total ?? response.data.meta?.total ?? data.length;
        const page = response.data.page ?? response.data.meta?.page ?? 1;
        const limit = response.data.limit ?? response.data.meta?.limit ?? 10;
        const totalPages = response.data.totalPages ?? response.data.meta?.totalPages ?? Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        };
    },

    async getUser(id: number): Promise<User> {
        const response = await api.get<User>(`/users/${id}`, {
            params: {
                included: 'role,regional,cargo,departamento'
            }
        });
        return response.data;
    },

    async createUser(data: CreateUserDto): Promise<User> {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    async updateUser(id: number, data: UpdateUserDto): Promise<User> {
        const response = await api.put<User>(`/users/${id}`, data);
        return response.data;
    },

    async deleteUser(id: number): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    /**
     * Sube la firma de perfil del usuario
     */
    async uploadProfileSignature(userId: number, file: File): Promise<{ success: boolean; path: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ success: boolean; path: string }>(`/users/${userId}/profile/signature`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Obtiene la URL de la firma de perfil del usuario
     */
    getProfileSignatureUrl(userId: number): string {
        return `${import.meta.env.VITE_API_URL}/users/${userId}/profile/signature`;
    }
};
