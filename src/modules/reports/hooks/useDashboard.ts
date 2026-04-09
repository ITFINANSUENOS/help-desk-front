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
    topPerf: (type: string, limit: number, dateRange?: DateRange) => ['dashboard', 'top-performers', type, limit, dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
    novedades: (dateRange?: DateRange) => ['dashboard', 'novedades', dateRange?.dateFrom ?? 'no-from', dateRange?.dateTo ?? 'no-to'],
};

export const useKpis = (regional?: string, dateRange?: DateRange) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.kpis(regional, dateRange),
        queryFn: () => dashboardApi.getKpis(regional, dateRange),
        staleTime: 30_000,
    });

export const useRanking = (limit = 50, page = 1, dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.ranking(limit, page, dateRange), queryFn: () => dashboardApi.getRanking(limit, page, dateRange) });

export const useRegionales = (dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.regionales(dateRange), queryFn: () => dashboardApi.getRegionales(dateRange) });

export const useMapaCalor = (regional?: string, dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.mapaCalor(regional, dateRange), queryFn: () => dashboardApi.getMapaCalor(regional, dateRange) });

export const useCategorias = (dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.categorias(dateRange), queryFn: () => dashboardApi.getCategorias(dateRange) });

export const useCuellos = (limit = 20, dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.cuellos(limit, dateRange), queryFn: () => dashboardApi.getCuellos(limit, dateRange) });

export const useDistribucion = (dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.distribucion(dateRange), queryFn: () => dashboardApi.getDistribucion(dateRange) });

export const useDetalleUsuario = (id: number, dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.detalle(id, dateRange), queryFn: () => dashboardApi.getDetalleUsuario(id, dateRange), enabled: !!id });

export const useTopPerformers = (type: 'top' | 'bottom' = 'top', limit = 10, dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.topPerf(type, limit, dateRange), queryFn: () => dashboardApi.getTopPerformers(type, limit, dateRange) });

export const useNovedades = (dateRange?: DateRange) =>
    useQuery({ queryKey: DASHBOARD_KEYS.novedades(dateRange), queryFn: () => dashboardApi.getNovedades(dateRange) });
