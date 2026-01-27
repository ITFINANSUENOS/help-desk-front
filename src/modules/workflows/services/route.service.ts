import { api } from '../../../core/api/api';
import type { Route, CreateRouteDto, UpdateRouteDto, RouteStep } from '../interfaces/Route';

export const routeService = {
    async getRoutes(flujoId?: number): Promise<Route[]> {
        const params: any = {};
        if (flujoId) params['filter[flujo.id]'] = flujoId;

        const response = await api.get<{ data: Route[] }>('/workflows/routes', { params });
        return response.data.data;
    },

    async createRoute(data: CreateRouteDto): Promise<Route> {
        const response = await api.post<Route>('/workflows/routes', data);
        return response.data;
    },

    async updateRoute(id: number, data: UpdateRouteDto): Promise<Route> {
        const response = await api.put<Route>(`/workflows/routes/${id}`, data);
        return response.data;
    },

    async deleteRoute(id: number): Promise<void> {
        await api.delete(`/workflows/routes/${id}`);
    },

    // Route Steps
    // Route Steps
    async getRouteSteps(rutaId: number): Promise<RouteStep[]> {
        const response = await api.get<{ data: RouteStep[] }>('/workflows/route-steps', {
            params: {
                'filter[ruta.id]': rutaId,
                included: 'paso,ruta',
                sort: 'orden:ASC'
            }
        });
        return response.data.data;
    },

    async addStepToRoute(rutaId: number, pasoId: number, orden: number): Promise<RouteStep> {
        const response = await api.post<RouteStep>('/workflows/route-steps', {
            rutaId,
            pasoId,
            orden
        });
        return response.data;
    },

    async removeStepFromRoute(routeStepId: number): Promise<void> {
        await api.delete(`/workflows/route-steps/${routeStepId}`);
    }
};
