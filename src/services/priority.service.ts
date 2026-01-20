import { api } from './api';
import type { Priority } from '../interfaces/Priority';

export const priorityService = {
    async getPriorities(): Promise<Priority[]> {
        const response = await api.get<Priority[]>('/priorities', {
            params: {
                'filter[estado]': 1
            }
        });
        const data = response.data as unknown as { data: Priority[] };
        return Array.isArray(response.data) ? response.data : (data.data || []);
    }
};
