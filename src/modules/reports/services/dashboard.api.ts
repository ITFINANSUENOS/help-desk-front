import { api as axios } from '../../../core/api/api';
import type {
    KpisGlobales, RankingResponse, RegionalStats, MapaCalorItem,
    CategoriaStats, CuelloBottleneck, DistribucionTiempos,
    DetalleUsuario, UsuarioRanking, Novedades,
    TicketsDetalleResponse
} from '../types/dashboard.types';
import type { DateRange } from '../components/ui/FiltroFecha';

const BASE = '/reports/dashboard';

function buildDateParams(dateRange?: DateRange): Record<string, string> {
    const params: Record<string, string> = {};
    if (dateRange?.dateFrom) params.dateFrom = dateRange.dateFrom;
    if (dateRange?.dateTo) params.dateTo = dateRange.dateTo;
    return params;
}

export const dashboardApi = {
    getKpis: (regional?: string, dateRange?: DateRange) =>
        axios.get<KpisGlobales>(`${BASE}/kpis`, { params: { regional, ...buildDateParams(dateRange) } }).then(r => r.data),

    getRanking: (limitParam = 50, pageParam = 1, dateRange?: DateRange) =>
        axios.get<RankingResponse>(`${BASE}/ranking`, { params: { limit: limitParam, page: pageParam, ...buildDateParams(dateRange) } }).then(r => r.data),

    getRegionales: (dateRange?: DateRange) =>
        axios.get<RegionalStats[]>(`${BASE}/regionales`, { params: buildDateParams(dateRange) }).then(r => r.data),

    getMapaCalor: (regional?: string, dateRange?: DateRange) =>
        axios.get<MapaCalorItem[]>(`${BASE}/mapa-calor`, { params: { regional, ...buildDateParams(dateRange) } }).then(r => r.data),

    getCategorias: (dateRange?: DateRange) =>
        axios.get<CategoriaStats[]>(`${BASE}/categorias`, { params: buildDateParams(dateRange) }).then(r => r.data),

    getCuellos: (limitParam = 20, dateRange?: DateRange) =>
        axios.get<CuelloBottleneck[]>(`${BASE}/cuellos-botella`, { params: { limit: limitParam, ...buildDateParams(dateRange) } }).then(r => r.data),

    getDistribucion: (dateRange?: DateRange) =>
        axios.get<DistribucionTiempos>(`${BASE}/distribucion-tiempos`, { params: buildDateParams(dateRange) }).then(r => r.data),

    getTicketsPorRango: (rango: string, orden: number, dateRange?: DateRange, limit = 50, page = 1) =>
        axios.get<{ data: Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso?: string; duracion_horas: number; veces_asignado: number }>; total: number; page: number; limit: number; totalPages: number; rango: string }>(
            `${BASE}/distribucion-tiempos/${encodeURIComponent(rango)}/tickets`,
            { params: { orden, ...buildDateParams(dateRange), limit, page } }
        ).then(r => r.data),

    getPasosDeTicket: (ticketId: number, dateRange?: DateRange) =>
        axios.get<Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso: string; duracion_horas: number; fechaCompletado: string }>>(
            `${BASE}/tickets/${ticketId}/pasos`,
            { params: buildDateParams(dateRange) }
        ).then(r => r.data),

    getDetalleUsuario: (id: number, dateRange?: DateRange) =>
        axios.get<DetalleUsuario>(`${BASE}/usuario/${id}/detalle`, { params: buildDateParams(dateRange) }).then(r => r.data),

    getTicketsPorUsuario: (id: number, dateRange?: DateRange, limit = 50, page = 1, paso?: string) =>
        axios.get<{ data: Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso?: string }>; total: number; page: number; limit: number; totalPages: number }>(
            `${BASE}/usuario/${id}/tickets`,
            { params: { ...buildDateParams(dateRange), limit, page, ...(paso ? { paso } : {}) } }
        ).then(r => r.data),

    getTicketsDetallePorUsuario: (id: number, dateRange?: DateRange, limit = 50, page = 1, tipo?: 'creados' | 'asignados') =>
        axios.get<TicketsDetalleResponse>(
            `${BASE}/usuario/${id}/tickets-detalle`,
            { params: { ...buildDateParams(dateRange), limit, page, ...(tipo ? { tipo } : {}) } }
        ).then(r => r.data),

    getTicketsPorRegional: (regional: string, dateRange?: DateRange, limit = 50, page = 1) =>
        axios.get<{ data: Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso?: string }>; total: number; page: number; limit: number; totalPages: number }>(
            `${BASE}/regionales/${encodeURIComponent(regional)}/tickets`,
            { params: { ...buildDateParams(dateRange), limit, page } }
        ).then(r => r.data),

    getTicketsPorCategoria: (categoria: string, dateRange?: DateRange, limit = 50, page = 1) =>
        axios.get<{ data: Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso?: string }>; total: number; page: number; limit: number; totalPages: number }>(
            `${BASE}/categorias/${encodeURIComponent(categoria)}/tickets`,
            { params: { ...buildDateParams(dateRange), limit, page } }
        ).then(r => r.data),

    getTicketsPorSubcategoria: (subcategoria: string, dateRange?: DateRange, limit = 50, page = 1) =>
        axios.get<{ data: Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso?: string }>; total: number; page: number; limit: number; totalPages: number }>(
            `${BASE}/subcategorias/${encodeURIComponent(subcategoria)}/tickets`,
            { params: { ...buildDateParams(dateRange), limit, page } }
        ).then(r => r.data),

    getTicketsPorPaso: (paso: string, dateRange?: DateRange, limit = 50, page = 1) =>
        axios.get<{ data: Array<{ id: number; titulo: string; estado: string; fechaCreacion: string; categoria: string; subcategoria: string; asignadoNombre: string; estadoTiempo: string; paso?: string; duracion_horas: number }>; total: number; page: number; limit: number; totalPages: number }>(
            `${BASE}/pasos/${encodeURIComponent(paso)}/tickets`,
            { params: { ...buildDateParams(dateRange), limit, page } }
        ).then(r => r.data),

    getTopPerformers: (typeParam: 'top' | 'bottom' = 'top', limitParam = 10, dateRange?: DateRange) =>
        axios.get<UsuarioRanking[]>(`${BASE}/top-performers`, { params: { type: typeParam, limit: limitParam, ...buildDateParams(dateRange) } }).then(r => r.data),

    getNovedades: (dateRange?: DateRange) =>
        axios.get<Novedades>(`${BASE}/novedades`, { params: buildDateParams(dateRange) }).then(r => r.data),

    exportar: (formatParam = 'xlsx', typeParam = 'full', dateRange?: DateRange) =>
        axios.get(`${BASE}/export`, { params: { format: formatParam, type: typeParam, ...buildDateParams(dateRange) }, responseType: 'blob' }).then(r => r.data),
};
