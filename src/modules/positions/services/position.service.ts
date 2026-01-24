import { api } from '../../../core/api/api';
import type { Position, CreatePositionDto, UpdatePositionDto } from '../interfaces/Position';

interface PositionsResponse {
    data: Position[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface GetPositionsParams {
    page?: number;
    limit?: number;
    search?: string;
    estado?: number | 'all';
}

class PositionService {
    async getPositions(params: GetPositionsParams): Promise<PositionsResponse> {
        const { page = 1, limit = 10, search, estado } = params;

        const queryParams: Record<string, any> = {
            page,
            limit
        };

        if (search) {
            queryParams['filter[nombre]'] = search; // Adjust if backend uses Q or generic search
            // If backend supports generic 'search' param:
            // queryParams.search = search;
        }

        if (estado !== 'all' && estado !== undefined) {
            queryParams['filter[estado]'] = estado;
        }

        const { data } = await api.get<PositionsResponse>('/positions', { params: queryParams });
        return data;
    }

    async getPosition(id: number): Promise<Position> {
        const { data } = await api.get<Position>(`/positions/${id}`);
        return data;
    }

    async createPosition(data: CreatePositionDto): Promise<Position> {
        const { data: response } = await api.post<Position>('/positions', data);
        return response;
    }

    async updatePosition(id: number, data: UpdatePositionDto): Promise<Position> {
        const { data: response } = await api.put<Position>(`/positions/${id}`, data);
        return response;
    }

    async deletePosition(id: number): Promise<void> {
        await api.delete(`/positions/${id}`);
    }
}

export const positionService = new PositionService();
