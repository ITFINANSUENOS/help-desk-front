import { api } from '../../../core/api/api';
import type {
    ErrorType,
    CreateErrorTypeDto,
    UpdateErrorTypeDto,
    ErrorTypeFilter,
    ErrorTypeListResponse,
    ErrorSubtype,
    CreateErrorSubtypeDto,
    UpdateErrorSubtypeDto
} from '../interfaces/ErrorType';

export const errorTypeService = {
    // Error Types (Master)
    async getErrorTypes(filter: ErrorTypeFilter = {}): Promise<ErrorTypeListResponse> {
        const params: Record<string, string | number> = {};

        params.page = filter.page || 1;
        params.limit = filter.limit || 10;

        if (filter.search) {
            params['search'] = filter.search;
        }

        if (filter.isActive !== undefined && filter.isActive !== 'all') {
            params['filter[isActive]'] = filter.isActive ? 1 : 0;
        }

        // Include subtypes by default
        params['included'] = 'subtypes';

        // Add sort by title asc
        params['sort'] = 'title';

        // We use a generic get because the backend response structure for paginated results matches 
        // what we expect in ErrorTypeListResponse (data, meta)
        const response = await api.get<ErrorTypeListResponse>('/error-types', { params });
        return response.data;
    },

    async getErrorType(id: number): Promise<ErrorType> {
        const response = await api.get<ErrorType>(`/error-types/${id}`);
        return response.data;
    },

    async createErrorType(data: CreateErrorTypeDto): Promise<ErrorType> {
        const response = await api.post<ErrorType>('/error-types', data);
        return response.data;
    },

    async updateErrorType(id: number, data: UpdateErrorTypeDto): Promise<ErrorType> {
        const response = await api.put<ErrorType>(`/error-types/${id}`, data);
        return response.data;
    },

    async deleteErrorType(id: number): Promise<void> {
        await api.delete(`/error-types/${id}`);
    },

    // Subtypes (Details)
    async getSubtypes(errorTypeId: number): Promise<ErrorSubtype[]> {
        const response = await api.get<ErrorSubtype[]>(`/error-types/${errorTypeId}/subtypes`);
        return response.data;
    },

    async createSubtype(data: CreateErrorSubtypeDto): Promise<ErrorSubtype> {
        const response = await api.post<ErrorSubtype>('/error-types/subtypes', data);
        return response.data;
    },

    async updateSubtype(id: number, data: UpdateErrorSubtypeDto): Promise<ErrorSubtype> {
        const response = await api.put<ErrorSubtype>(`/error-types/subtypes/${id}`, data);
        return response.data;
    },

    async deleteSubtype(id: number): Promise<void> {
        await api.delete(`/error-types/subtypes/${id}`);
    }
};
