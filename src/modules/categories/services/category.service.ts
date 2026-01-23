import { api } from '../../../core/api/api';
import type { Category, CreateCategoryDto, UpdateCategoryDto, CategoryFilter } from '../interfaces/Category';
import type { PaginatedResponse } from '../../../shared/interfaces/PaginatedResponse';

/**
 * Servicio para gestionar categorías
 */
export const categoryService = {
    /**
     * Obtiene todas las categorías
     * @param filters - Filtros opcionales
     */
    async getAll(filters?: CategoryFilter): Promise<PaginatedResponse<Category>> {
        const params = new URLSearchParams();

        if (filters?.search) {
            params.append('search', filters.search);
        }

        if (filters?.estado !== undefined && filters.estado !== 'all') {
            params.append('filter[estado]', filters.estado.toString());
        }

        if (filters?.departamentoId !== undefined && filters.departamentoId !== 'all') {
            params.append('filter[departamentoId]', filters.departamentoId.toString());
        }

        if (filters?.page) {
            params.append('page', filters.page.toString());
        }

        if (filters?.limit) {
            params.append('limit', filters.limit.toString());
        }

        // Incluir departamentos y empresas
        params.append('included', 'departamentos,empresas');

        const response = await api.get<any>(`/categories?${params.toString()}`);

        // Normalización de la respuesta
        const rawData = response.data;
        const data: Category[] = rawData.data || (Array.isArray(rawData) ? rawData : []);

        // Extraer metadata con fallbacks (soporta total en root o en meta)
        const total = rawData.total ?? rawData.meta?.total ?? data.length;
        const page = rawData.page ?? rawData.meta?.page ?? filters?.page ?? 1;
        const limit = rawData.limit ?? rawData.meta?.limit ?? filters?.limit ?? 10;
        const totalPages = rawData.totalPages ?? rawData.meta?.totalPages ?? rawData.lastPage ?? rawData.meta?.lastPage ?? Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                lastPage: totalPages // Aseguramos compatibilidad con PaginatedResponse interface
            }
        };
    },

    /**
     * Obtiene una categoría por ID
     */
    async getById(id: number): Promise<Category> {
        const response = await api.get<Category>(`/categories/${id}`);
        return response.data;
    },

    /**
     * Crea una nueva categoría
     */
    async create(data: CreateCategoryDto): Promise<Category> {
        const response = await api.post<Category>('/categories', data);
        return response.data;
    },

    /**
     * Actualiza una categoría existente
     */
    async update(id: number, data: UpdateCategoryDto): Promise<Category> {
        const response = await api.put<Category>(`/categories/${id}`, data);
        return response.data;
    },

    /**
     * Elimina una categoría
     */
    async delete(id: number): Promise<void> {
        await api.delete(`/categories/${id}`);
    }
};
