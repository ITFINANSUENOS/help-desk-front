import { api } from "../../../core/api/api";
import type { TemplateField } from '../interfaces/TemplateField';

export interface TemplateFieldFilter {
    search?: string;
    limit?: number;
    flujoId?: number;
}


class TemplateService {
    private readonly baseUrl = '/templates';

    async getAllFields(filter: TemplateFieldFilter = {}): Promise<TemplateField[]> {
        const params = new URLSearchParams();
        if (filter.search) params.append('search', filter.search);
        if (filter.limit) params.append('limit', filter.limit.toString());
        if (filter.flujoId) params.append('filter[flujo.id]', filter.flujoId.toString());

        const response = await api.get<TemplateField[]>(`${this.baseUrl}?${params.toString()}`);
        return response.data;
    }

    async executeFieldQuery(fieldId: number, term = ''): Promise<any[]> {
        const response = await api.get<any[]>(`${this.baseUrl}/query/${fieldId}?term=${encodeURIComponent(term)}`);
        return response.data;
    }

    async getTemplates(flujoId: number): Promise<any[]> {
        const response = await api.get(`${this.baseUrl}?filter[flujo.id]=${flujoId}&included=empresa`);
        return response.data.data;
    }

    async createTemplate(flujoId: number, empresaId: number, file: File): Promise<void> {
        const formData = new FormData();
        formData.append('flujoId', String(flujoId));
        formData.append('empresaId', String(empresaId));
        formData.append('file', file);

        await api.post(this.baseUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async deleteTemplate(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}/${id}`);
    }
}

export const templateService = new TemplateService();
