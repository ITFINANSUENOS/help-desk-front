import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';

// Keys centralizadas para invalidación
export const DASHBOARD_KEYS = {
    kpis: (regional?: string) => ['dashboard', 'kpis', regional ?? 'global'],
    ranking: (limit: number, page: number) => ['dashboard', 'ranking', limit, page],
    regionales: ['dashboard', 'regionales'],
    mapaCalor: (regional?: string) => ['dashboard', 'mapa-calor', regional ?? 'all'],
    categorias: ['dashboard', 'categorias'],
    cuellos: (limit: number) => ['dashboard', 'cuellos', limit],
    distribucion: ['dashboard', 'distribucion'],
    detalle: (id: number) => ['dashboard', 'usuario', id, 'detalle'],
    topPerf: (type: string, limit: number) => ['dashboard', 'top-performers', type, limit],
    novedades: ['dashboard', 'novedades'],
};

export const useKpis = (regional?: string) =>
    useQuery({
        queryKey: DASHBOARD_KEYS.kpis(regional),
        queryFn: () => dashboardApi.getKpis(regional),
        staleTime: 30_000,
    });

export const useRanking = (limit = 50, page = 1) =>
    useQuery({ queryKey: DASHBOARD_KEYS.ranking(limit, page), queryFn: () => dashboardApi.getRanking(limit, page) });

export const useRegionales = () =>
    useQuery({ queryKey: DASHBOARD_KEYS.regionales, queryFn: dashboardApi.getRegionales });

export const useMapaCalor = (regional?: string) =>
    useQuery({ queryKey: DASHBOARD_KEYS.mapaCalor(regional), queryFn: () => dashboardApi.getMapaCalor(regional) });

export const useCategorias = () =>
    useQuery({ queryKey: DASHBOARD_KEYS.categorias, queryFn: dashboardApi.getCategorias });

export const useCuellos = (limit = 20) =>
    useQuery({ queryKey: DASHBOARD_KEYS.cuellos(limit), queryFn: () => dashboardApi.getCuellos(limit) });

export const useDistribucion = () =>
    useQuery({ queryKey: DASHBOARD_KEYS.distribucion, queryFn: dashboardApi.getDistribucion });

export const useDetalleUsuario = (id: number) =>
    useQuery({ queryKey: DASHBOARD_KEYS.detalle(id), queryFn: () => dashboardApi.getDetalleUsuario(id), enabled: !!id });



export const useTopPerformers = (type: 'top' | 'bottom' = 'top', limit = 10) =>
    useQuery({ queryKey: DASHBOARD_KEYS.topPerf(type, limit), queryFn: () => dashboardApi.getTopPerformers(type, limit) });

export const useNovedades = () =>
    useQuery({ queryKey: DASHBOARD_KEYS.novedades, queryFn: dashboardApi.getNovedades });
