import { api } from "../../../core/api/api";
import type { TemplateField, TemplateSignature } from '../../workflows/interfaces/TemplateField';

export interface TemplateFilter {
    search?: string;
    limit?: number;
    page?: number;
    flujoId?: number;
}


class TemplateService {
    private readonly baseUrl = '/templates';

    async getAllFields(filter: TemplateFilter = {}): Promise<TemplateField[]> {
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

    // ==================== Template Signature Zones (PlantillaFirma) ====================

    async getTemplateSignatures(flujoPlantillaId: number): Promise<TemplateSignature[]> {
        const response = await api.get<TemplateSignature[]>(`${this.baseUrl}/${flujoPlantillaId}/firmas`);
        return response.data;
    }

    async createTemplateSignature(
        flujoPlantillaId: number,
        data: { coordX: number; coordY: number; pagina?: number; etiqueta?: string }
    ): Promise<TemplateSignature> {
        const response = await api.post<TemplateSignature>(`${this.baseUrl}/${flujoPlantillaId}/firmas`, data);
        return response.data;
    }

    async updateTemplateSignature(
        firmaId: number,
        data: { coordX?: number; coordY?: number; pagina?: number; etiqueta?: string }
    ): Promise<TemplateSignature> {
        const response = await api.put<TemplateSignature>(`${this.baseUrl}/firmas/${firmaId}`, data);
        return response.data;
    }

    async deleteTemplateSignature(firmaId: number): Promise<void> {
        await api.delete(`${this.baseUrl}/firmas/${firmaId}`);
    }

    // ==================== Template Fields (PlantillaCampo) ====================

    async getTemplateFields(flujoPlantillaId: number): Promise<TemplateField[]> {
        const response = await api.get<TemplateField[]>(`${this.baseUrl}/${flujoPlantillaId}/campos`);
        return response.data;
    }

    async createTemplateField(
        flujoPlantillaId: number,
        data: {
            campoNombre: string;
            campoCodigo: string;
            campoTipo?: string;
            coordX: number;
            coordY: number;
            etiqueta?: string;
            pagina?: number;
            fontSize?: number;
        }
    ): Promise<TemplateField> {
        const response = await api.post<TemplateField>(`${this.baseUrl}/${flujoPlantillaId}/campos`, data);
        return response.data;
    }

    async updateTemplateField(
        campoId: number,
        data: Partial<TemplateField>
    ): Promise<TemplateField> {
        const response = await api.put<TemplateField>(`${this.baseUrl}/campos/${campoId}`, data);
        return response.data;
    }

    async deleteTemplateField(campoId: number): Promise<void> {
        await api.delete(`${this.baseUrl}/campos/${campoId}`);
    }
}

export const templateService = new TemplateService();
