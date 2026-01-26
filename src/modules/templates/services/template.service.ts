import { api } from "../../../core/api/api";
import type { TemplateField, TemplateFieldFilter } from '../interfaces/TemplateField';

class TemplateService {
    private readonly baseUrl = '/templates';

    async getAllFields(filter: TemplateFieldFilter = {}): Promise<TemplateField[]> {
        const params = new URLSearchParams();
        if (filter.search) params.append('search', filter.search);
        if (filter.limit) params.append('limit', filter.limit.toString());

        const response = await api.get<TemplateField[]>(`${this.baseUrl}?${params.toString()}`);
        return response.data;
    }
}

export const templateService = new TemplateService();
