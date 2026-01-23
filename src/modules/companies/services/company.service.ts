import { api } from '../../../core/api/api';
import type { Company, CreateCompanyDto, UpdateCompanyDto, CompanyFilter, CompanyListResponse } from '../interfaces/Company';

export const companyService = {
    async getCompanies(filter: CompanyFilter = {}): Promise<CompanyListResponse> {
        const params: Record<string, string | number> = {};

        params.page = filter.page || 1;
        params.limit = filter.limit || 10;

        if (filter.search) {
            params['filter[nombre]'] = filter.search;
        }

        if (filter.estado !== undefined && filter.estado !== 'all') {
            params['filter[estado]'] = filter.estado;
        }

        const response = await api.get<{ data: Company[]; meta: any }>('/companies', { params });

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

    async getAll(): Promise<Company[]> {
        const response = await api.get<{ data: Company[] }>('/companies', {
            params: { limit: 1000, 'filter[estado]': 1 }
        });
        return response.data.data || [];
    },

    async getCompany(id: number): Promise<Company> {
        const response = await api.get<Company>(`/companies/${id}`);
        return response.data;
    },

    async createCompany(data: CreateCompanyDto): Promise<Company> {
        const response = await api.post<Company>('/companies', data);
        return response.data;
    },

    async updateCompany(id: number, data: UpdateCompanyDto): Promise<Company> {
        const response = await api.put<Company>(`/companies/${id}`, data);
        return response.data;
    },

    async deleteCompany(id: number): Promise<void> {
        await api.delete(`/companies/${id}`);
    }
};
