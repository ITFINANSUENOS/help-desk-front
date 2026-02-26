import { api as axios } from '../../../core/api/api';
import type {
    KpisGlobales, RankingResponse, RegionalStats, MapaCalorItem,
    CategoriaStats, CuelloBottleneck, DistribucionTiempos,
    DetalleUsuario, UsuarioRanking, Novedades,
    DetallePaso
} from '../types/dashboard.types';

const BASE = '/reports/dashboard';

export const dashboardApi = {
    getKpis: (regional?: string) =>
        axios.get<KpisGlobales>(`${BASE}/kpis`, { params: regional ? { regional } : {} }).then(r => r.data),

    getRanking: (limitParam = 50, pageParam = 1) =>
        axios.get<RankingResponse>(`${BASE}/ranking`, { params: { limit: limitParam, page: pageParam } }).then(r => r.data),

    getRegionales: () =>
        axios.get<RegionalStats[]>(`${BASE}/regionales`).then(r => r.data),

    getMapaCalor: (regional?: string) =>
        axios.get<MapaCalorItem[]>(`${BASE}/mapa-calor`, { params: regional ? { regional } : {} }).then(r => r.data),

    getCategorias: () =>
        axios.get<CategoriaStats[]>(`${BASE}/categorias`).then(r => r.data),

    getCuellos: (limitParam = 20) =>
        axios.get<CuelloBottleneck[]>(`${BASE}/cuellos-botella`, { params: { limit: limitParam } }).then(r => r.data),

    getDistribucion: () =>
        axios.get<DistribucionTiempos>(`${BASE}/distribucion-tiempos`).then(r => r.data),

    getDetalleUsuario: (id: number) =>
        axios.get<DetalleUsuario>(`${BASE}/usuario/${id}/detalle`).then(r => r.data),

    getPasosUsuario: (id: number) =>
        axios.get<DetallePaso[]>(`${BASE}/usuario/${id}/pasos`).then(r => r.data),

    getTopPerformers: (typeParam: 'top' | 'bottom' = 'top', limitParam = 10) =>
        axios.get<UsuarioRanking[]>(`${BASE}/top-performers`, { params: { type: typeParam, limit: limitParam } }).then(r => r.data),

    getNovedades: () =>
        axios.get<Novedades>(`${BASE}/novedades`).then(r => r.data),

    exportar: (formatParam = 'xlsx', typeParam = 'full') =>
        axios.get(`${BASE}/export`, { params: { format: formatParam, type: typeParam }, responseType: 'blob' }).then(r => r.data),
};
