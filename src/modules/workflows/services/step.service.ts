import { api } from '../../../core/api/api';
import type { Step, CreateStepDto, UpdateStepDto, StepFilter, StepListResponse } from '../interfaces/Step';

export const stepService = {
    async getSteps(filter: StepFilter = {}): Promise<StepListResponse> {
        const params: Record<string, string | number> = {};

        params.page = filter.page || 1;
        params.limit = filter.limit || 100; // Usually we want all steps for a workflow

        if (filter.flujoId) {
            params['filter[flujo.id]'] = filter.flujoId;
        }

        if (filter.search) {
            params['filter[nombre]'] = filter.search;
        }

        // Include relations relevant for listing
        params['included'] = 'cargoAsignado';

        // Add default sorting by order
        // Note: Backend might need specific sort param, assuming default sort by ID or implementing logic. 
        // Ideally we sort by 'orden'. If backend doesn't support 'sort', we might need to sort client-side.

        const response = await api.get<{ data: Step[], meta: any }>('/workflows/steps', { params });

        const data = response.data.data || [];
        // Ensure meta exists or provide defaults
        const meta = response.data.meta || {
            total: data.length,
            page: params.page,
            limit: params.limit,
            totalPages: 1
        };

        return { data, meta };
    },

    async getStep(id: number): Promise<Step> {
        const response = await api.get<Step>(`/workflows/steps/${id}`, {
            params: { included: 'cargoAsignado,firmas,campos,usuarios' }
        });
        return response.data;
    },

    async createStep(data: CreateStepDto): Promise<Step> {
        const response = await api.post<Step>('/workflows/steps', data);
        return response.data;
    },

    async updateStep(id: number, data: UpdateStepDto): Promise<Step> {
        const response = await api.put<Step>(`/workflows/steps/${id}`, data);
        return response.data;
    },

    async deleteStep(id: number): Promise<void> {
        await api.delete(`/workflows/steps/${id}`);
    },

    async getCoordinates(stepId: number, empresaId: number): Promise<{ firmas: any[]; campos: any[] }> {
        const response = await api.get<{ firmas: any[]; campos: any[] }>(`/workflows/steps/${stepId}/coordinates`, {
            params: { empresaId },
        });
        return response.data;
    },

    async getStepAttachments(stepId: number): Promise<any[]> {
        const response = await api.get<any[]>(`/workflows/steps/${stepId}/attachments`);
        return response.data;
    },

    async uploadStepAttachment(stepId: number, file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/workflows/steps/${stepId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async deleteStepAttachment(stepId: number, attachmentId: number): Promise<void> {
        await api.delete(`/workflows/steps/${stepId}/attachments/${attachmentId}`);
    },

    async uploadFile(id: number, file: File): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/workflows/steps/${id}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async importSteps(flujoId: number, file: File): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('flujoId', String(flujoId));
        await api.post('/workflows/steps/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};
