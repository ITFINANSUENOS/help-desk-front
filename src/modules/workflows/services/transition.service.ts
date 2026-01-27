import { api } from '../../../core/api/api';
import type { Transition, CreateTransitionDto } from '../interfaces/Transition';

export const transitionService = {
    async getTransitions(pasoOrigenId: number): Promise<Transition[]> {
        const response = await api.get<{ data: Transition[] }>('/workflows/transitions', {
            params: { 'filter[pasoOrigenId]': pasoOrigenId, included: 'pasoDestino,rutaDestino' }
        });
        return response.data.data;
    },

    async createTransition(data: CreateTransitionDto): Promise<Transition> {
        const response = await api.post<Transition>('/workflows/transitions', data);
        return response.data;
    },

    async deleteTransition(id: number): Promise<void> {
        await api.delete(`/workflows/transitions/${id}`);
    }
};
