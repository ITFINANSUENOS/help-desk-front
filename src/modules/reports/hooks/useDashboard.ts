import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';
import type { DateRange } from '../components/ui/FiltroFecha';

// Keys centralizadas para invalidación
export const DASHBOARD_KEYS = {
    kpis: (regional?: string, dateRange?: DateRange) => ['dashboard', 'kpis', regional ?? 'global', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    ranking: (limit: number, page: number, dateRange?: DateRange) => ['dashboard', 'ranking', limit, page, dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    regionales: (dateRange?: DateRange) => ['dashboard', 'regionales', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    mapaCalor: (regional?: string, dateRange?: DateRange) => ['dashboard', 'mapa-calor', regional ?? 'all', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    categorias: (dateRange?: DateRange) => ['dashboard', 'categorias', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    cuellos: (limit: number, dateRange?: DateRange) => ['dashboard', 'cuellos', limit, dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    distribucion: (dateRange?: DateRange) => ['dashboard', 'distribucion', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    detalle: (id: number, dateRange?: DateRange) => ['dashboard', 'usuario', id, 'detalle', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    ticketsUsuario: (id: number, dateRange?: DateRange) => ['dashboard', 'usuario', id, 'tickets', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    ticketsDetalleUsuario: (id: number, dateRange?: DateRange) => ['dashboard', 'usuario', id, 'tickets-detalle', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    ticketsPorRegional: (regional: string, dateRange?: DateRange) => ['dashboard', 'regional', regional, 'tickets', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    topPerf: (type: string, limit: number, dateRange?: DateRange) => ['dashboard', 'top-performers', type, limit, dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    novedades: (dateRange?: DateRange) => ['dashboard', 'novedades', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
};

export const useKpis = (regional?: string, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.kpis(regional, dateRange),
        queryFn: () => dashboardApi.getKpis(regional, dateRange),
        staleTime: 30_000,
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useRanking = (limit = 50, page = 1, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.ranking(limit, page, dateRange),
        queryFn: () => dashboardApi.getRanking(limit, page, dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useRegionales = (dateRange?: DateRange) => {
    // Si no hay dateRange, usar últimos 30 días como fallback
    const effectiveDateRange = dateRange?.dateFrom || dateRange?.dateTo
        ? dateRange
        : {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        };

    return useQuery({
        queryKey: DASHBOARD_KEYS.regionales(effectiveDateRange),
        queryFn: () => dashboardApi.getRegionales(effectiveDateRange),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
};

export const useMapaCalor = (regional?: string, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.mapaCalor(regional, dateRange),
        queryFn: () => dashboardApi.getMapaCalor(regional, dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useCategorias = (dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.categorias(dateRange),
        queryFn: () => dashboardApi.getCategorias(dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useCuellos = (limit = 20, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.cuellos(limit, dateRange),
        queryFn: () => dashboardApi.getCuellos(limit, dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useDistribucion = (dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.distribucion(dateRange),
        queryFn: () => dashboardApi.getDistribucion(dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useDetalleUsuario = (id: number, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.detalle(id, dateRange),
        queryFn: () => dashboardApi.getDetalleUsuario(id, dateRange),
        enabled: !!(id && dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useTicketsPorUsuario = (id: number, dateRange?: DateRange, limit = 50, page = 1, paso?: string) =>
    useQuery({
        queryKey: [...DASHBOARD_KEYS.ticketsUsuario(id, dateRange), paso ?? 'all'],
        queryFn: () => dashboardApi.getTicketsPorUsuario(id, dateRange, limit, page, paso),
        enabled: !!(id && dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useTicketsDetallePorUsuario = (id: number | undefined, dateRange?: DateRange, limit = 50, page = 1, tipo?: 'creados' | 'asignados') =>
    useQuery({
        queryKey: [...DASHBOARD_KEYS.ticketsDetalleUsuario(id ?? 0, dateRange), tipo ?? 'todos'],
        queryFn: () => dashboardApi.getTicketsDetallePorUsuario(id!, dateRange, limit, page, tipo),
        enabled: !!(id && dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useTicketsPorRegional = (regional?: string, dateRange?: DateRange, limit = 50, page = 1) => {
    // Si no hay dateRange, usar últimos 30 días como fallback
    const effectiveDateRange = dateRange?.dateFrom || dateRange?.dateTo
        ? dateRange
        : {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        };

    return useQuery({
        queryKey: DASHBOARD_KEYS.ticketsPorRegional(regional ?? '', effectiveDateRange),
        queryFn: () => dashboardApi.getTicketsPorRegional(regional!, effectiveDateRange, limit, page),
        enabled: !!regional,
        staleTime: 0,
    });
};

export const useTicketsPorCategoria = (categoria?: string, dateRange?: DateRange, limit = 50, page = 1) => {
    const effectiveDateRange = dateRange?.dateFrom || dateRange?.dateTo
        ? dateRange
        : {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        };

    return useQuery({
        queryKey: ['dashboard', 'categoria', categoria ?? '', effectiveDateRange.dateFrom, effectiveDateRange.dateTo, limit, page],
        queryFn: () => dashboardApi.getTicketsPorCategoria(categoria!, effectiveDateRange, limit, page),
        enabled: !!categoria,
        staleTime: 0,
    });
};

export const useTicketsPorSubcategoria = (subcategoria?: string, dateRange?: DateRange, limit = 50, page = 1) => {
    const effectiveDateRange = dateRange?.dateFrom || dateRange?.dateTo
        ? dateRange
        : {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        };

    return useQuery({
        queryKey: ['dashboard', 'subcategoria', subcategoria ?? '', effectiveDateRange.dateFrom, effectiveDateRange.dateTo, limit, page],
        queryFn: () => dashboardApi.getTicketsPorSubcategoria(subcategoria!, effectiveDateRange, limit, page),
        enabled: !!subcategoria,
        staleTime: 0,
    });
};

export const useTicketsPorRango = (rango?: string, orden?: number, dateRange?: DateRange, limit = 50, page = 1) => {
    const effectiveDateRange = dateRange?.dateFrom || dateRange?.dateTo
        ? dateRange
        : {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        };

    return useQuery({
        queryKey: ['dashboard', 'rango', rango ?? '', orden ?? 0, effectiveDateRange.dateFrom, effectiveDateRange.dateTo, limit, page],
        queryFn: () => dashboardApi.getTicketsPorRango(rango!, orden ?? 1, effectiveDateRange, limit, page),
        enabled: !!rango,
        staleTime: 0,
    });
};

export const usePasosDeTicket = (ticketId?: number, dateRange?: DateRange) => {
    const effectiveDateRange = dateRange?.dateFrom || dateRange?.dateTo
        ? dateRange
        : {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        };

    return useQuery({
        queryKey: ['dashboard', 'ticket', ticketId ?? 0, 'pasos', effectiveDateRange.dateFrom, effectiveDateRange.dateTo],
        queryFn: () => dashboardApi.getPasosDeTicket(ticketId!, effectiveDateRange),
        enabled: !!ticketId,
        staleTime: 0,
    });
};

export const useTopPerformers = (type: 'top' | 'bottom' = 'top', limit = 10, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.topPerf(type, limit, dateRange),
        queryFn: () => dashboardApi.getTopPerformers(type, limit, dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });

export const useNovedades = (dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.novedades(dateRange),
        queryFn: () => dashboardApi.getNovedades(dateRange),
        enabled: !!(dateRange?.dateFrom && dateRange?.dateTo),
    });
