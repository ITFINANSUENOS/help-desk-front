import { api } from '../../../core/api/api';
import type { Subcategory, CreateSubcategoryDto, UpdateSubcategoryDto, SubcategoryFilter, SubcategoryListResponse } from '../interfaces/Subcategory';

export const subcategoryService = {
    async getSubcategories(filter: SubcategoryFilter = {}): Promise<SubcategoryListResponse> {
        const params: Record<string, string | number> = {};

        params.page = filter.page || 1;
        params.limit = filter.limit || 10;

        if (filter.search) {
            params['filter[nombre]'] = filter.search;
        }

        if (filter.estado !== undefined && filter.estado !== 'all') {
            params['filter[estado]'] = filter.estado;
        }

        if (filter.categoriaId !== undefined && filter.categoriaId !== 'all') {
            params['filter[categoriaId]'] = filter.categoriaId;
        }

        // Include relations
        params['included'] = 'categoria,prioridad';

        const response = await api.get<{ data: Subcategory[]; meta: any }>('/subcategorias', { params });

        // Handle pagination metadata robustly
        const data = response.data.data || [];
        const total = response.data.meta?.total ?? data.length;
        const page = response.data.meta?.page ?? params.page;
        const limit = response.data.meta?.limit ?? params.limit;
        const totalPages = response.data.meta?.totalPages ?? Math.ceil(total / Number(limit));

        return {
            data,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        };
    },

    async getAll(): Promise<Subcategory[]> {
        const response = await api.get<{ data: Subcategory[] }>('/subcategorias', {
            params: { limit: 1000, 'filter[estado]': 1, included: 'categoria,prioridad' }
        });
        return response.data.data || [];
    },

    async getByCategory(categoriaId: number): Promise<Subcategory[]> {
        const response = await api.get<{ data: Subcategory[] }>('/subcategorias', {
            params: { limit: 1000, 'filter[estado]': 1, 'filter[categoriaId]': categoriaId }
        });
        return response.data.data || [];
    },

    async getSubcategory(id: number): Promise<Subcategory> {
        const response = await api.get<Subcategory>(`/subcategorias/${id}`, {
            params: { included: 'categoria,prioridad' }
        });
        return response.data;
    },

    async createSubcategory(data: CreateSubcategoryDto): Promise<Subcategory> {
        const response = await api.post<Subcategory>('/subcategorias', data);
        return response.data;
    },

    async updateSubcategory(id: number, data: UpdateSubcategoryDto): Promise<Subcategory> {
        const response = await api.put<Subcategory>(`/subcategorias/${id}`, data);
        return response.data;
    },

    async deleteSubcategory(id: number): Promise<void> {
        await api.delete(`/subcategorias/${id}`);
    }
};
