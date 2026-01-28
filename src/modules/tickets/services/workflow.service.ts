import { api } from '../../../core/api/api';
import type { CheckStartFlowResponse } from '../interfaces/Workflow';

export const workflowService = {
    async checkStartFlow(subcategoryId: number, companyId?: number): Promise<CheckStartFlowResponse> {
        const query = companyId ? `?companyId=${companyId}` : '';
        const response = await api.get<CheckStartFlowResponse>(`/workflows/check-start-flow/${subcategoryId}${query}`);
        return response.data;
    }
};
