import { api } from '../../../core/api/api';
import type { Subcategory } from '../interfaces/Subcategory';

export const subcategoryService = {
    async getByCategory(categoryId: number): Promise<Subcategory[]> {
        const response = await api.get('/subcategorias', {
            params: {
                'filter[categoriaId]': categoryId,
                'filter[estado]': 1
            }
        });
        // Assuming the API returns a standard ListResponse or array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = response.data as any;
        return Array.isArray(data) ? data : (data.data || []);
    },

    async getAllowedByCategory(categoryId: number): Promise<Subcategory[]> {
        const response = await api.get<Subcategory[]>('/subcategorias/allowed', {
            params: { categoryId }
        });
        return response.data;
    },

    async getAllowedByDepartment(departmentId: number): Promise<Subcategory[]> {
        const response = await api.get<Subcategory[]>('/subcategorias/allowed/by-department', {
            params: { departmentId }
        });
        return response.data;
    },

    async getByCompany(companyId: number): Promise<Subcategory[]> {
        const response = await api.get('/subcategorias', {
            params: {
                'filter[empresaId]': companyId,
                'filter[estado]': 1
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = response.data as any;
        return Array.isArray(data) ? data : (data.data || []);
    }
};
