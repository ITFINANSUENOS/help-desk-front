import { api } from '../../../core/api/api';
import type {
    Workflow,
    CreateWorkflowDto,
    UpdateWorkflowDto,
    WorkflowFilter,
    WorkflowListResponse
} from '../interfaces/Workflow';

export const workflowService = {
    async getWorkflows(filter: WorkflowFilter = {}): Promise<WorkflowListResponse> {
        const params: Record<string, string | number> = {};
        if (filter.search) params.search = filter.search;
        if (filter.estado && filter.estado !== 'all') params.estado = filter.estado;
        params.page = filter.page || 1;
        params.limit = filter.limit || 10;
        params['included'] = 'subcategoria';

        const response = await api.get<WorkflowListResponse>('/workflows', { params });
        return response.data;
    },

    async getWorkflow(id: number): Promise<Workflow> {
        const response = await api.get<Workflow>(`/workflows/${id}`, {
            params: { included: 'subcategoria,usuariosObservadores' }
        });
        return response.data;
    },

    async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
        const response = await api.post<Workflow>('/workflows', data);
        return response.data;
    },

    async updateWorkflow(id: number, data: UpdateWorkflowDto): Promise<Workflow> {
        const response = await api.put<Workflow>(`/workflows/${id}`, data);
        return response.data;
    },

    async deleteWorkflow(id: number): Promise<void> {
        await api.delete(`/workflows/${id}`);
    }
};
