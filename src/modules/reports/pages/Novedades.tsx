import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNovedades } from '../hooks/useDashboard';
import { PieNovedades } from '../components/charts/PieNovedades';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatPct, formatNumero } from '../utils/formatters';
import type { UsuarioNovedad, TipoNovedad } from '../types/dashboard.types';
import { ReportHeader } from '../components/ui/ReportHeader';

// ─── Tipos de filtro disponibles ──────────────────────────────────────────────
type FiltroNovedad = 'todos' | 'graves' | 'error_proceso' | 'cierre_forzoso' | 'leves' | 'error_informativo' | 'novedad_asignada' | 'novedad_resuelta';

interface FiltroConfig {
    label: string;
    color: 'rojo' | 'amarillo' | 'todos';
    icon: string;
}

const FILTROS: Record<FiltroNovedad, FiltroConfig> = {
    todos: { label: 'Todos', color: 'todos', icon: 'filter_list' },
    graves: { label: 'Errores Graves', color: 'rojo', icon: 'crisis_alert' },
    error_proceso: { label: 'Error Proceso', color: 'rojo', icon: 'error' },
    cierre_forzoso: { label: 'Cierre Forzoso', color: 'rojo', icon: 'block' },
    leves: { label: 'Errores Leves', color: 'amarillo', icon: 'warning' },
    error_informativo: { label: 'Error Informativo', color: 'amarillo', icon: 'info' },
    novedad_asignada: { label: 'Nov. Asignada', color: 'amarillo', icon: 'assignment' },
    novedad_resuelta: { label: 'Nov. Resuelta', color: 'amarillo', icon: 'task_alt' },
};

/** Retorna la cantidad según el filtro seleccionado */
function getCantidadFiltro(row: UsuarioNovedad, filtro: FiltroNovedad): number {
    switch (filtro) {
        case 'todos': return row.total_graves + row.total_leves;
        case 'graves': return row.total_graves;
        case 'error_proceso': return row.cant_error_proceso;
        case 'cierre_forzoso': return row.cant_cierre_forzoso;
        case 'leves': return row.total_leves;
        case 'error_informativo': return row.cant_error_informativo;
        case 'novedad_asignada': return row.cant_novedad_asignada;
        case 'novedad_resuelta': return row.cant_novedad_resuelta;
    }
}

/** Retorna el % según el filtro seleccionado */
function getPctFiltro(row: UsuarioNovedad, filtro: FiltroNovedad): number {
    switch (filtro) {
        case 'todos': return row.pct_graves;
        case 'graves': return row.pct_graves;
        case 'error_proceso': return row.pct_error_proceso;
        case 'cierre_forzoso': return row.pct_cierre_forzoso;
        case 'leves': return row.pct_error_informativo + row.pct_novedad_asignada + row.pct_novedad_resuelta;
        case 'error_informativo': return row.pct_error_informativo;
        case 'novedad_asignada': return row.pct_novedad_asignada;
        case 'novedad_resuelta': return row.pct_novedad_resuelta;
    }
}

/** Retorna clasificación según el filtro */
function getClasifFiltro(row: UsuarioNovedad, filtro: FiltroNovedad): 'verde' | 'amarillo' | 'rojo' {
    // Para filtros de errores graves → clasificación basada en pct del tipo
    if (filtro === 'todos' || filtro === 'graves') return row.clasificacion;
    const pct = getPctFiltro(row, filtro);
    if (filtro === 'error_proceso' || filtro === 'cierre_forzoso') {
        return pct >= 15 ? 'rojo' : pct >= 5 ? 'amarillo' : 'verde';
    }
    // Leves — umbral más alto
    return pct >= 20 ? 'amarillo' : 'verde';
}

// Mapeo de tipo_novedad string → FiltroNovedad
const TIPO_A_FILTRO: Record<string, FiltroNovedad> = {
    'Error Proceso': 'error_proceso',
    'Cierre Forzoso': 'cierre_forzoso',
    'Error Informativo': 'error_informativo',
    'Novedad Asignada': 'novedad_asignada',
    'Novedad Resuelta': 'novedad_resuelta',
};

const TIPO_COLOR: Record<string, string> = {
    'Error Proceso': 'text-red-600',
    'Cierre Forzoso': 'text-red-500',
    'Error Informativo': 'text-yellow-600',
    'Novedad Asignada': 'text-yellow-500',
    'Novedad Resuelta': 'text-green-600',
};

// ─── Tabla pequeña de distribución de tipos (interactiva) ─────────────────────
function TablaTipos({
    data,
    filtroActivo,
    onSelect,
}: {
    data: TipoNovedad[];
    filtroActivo: FiltroNovedad;
    onSelect: (f: FiltroNovedad) => void;
}) {
    return (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="py-2 px-3 text-left">Tipo</th>
                        <th className="py-2 px-3 text-right">Cantidad</th>
                        <th className="py-2 px-3 text-right">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {/* Fila «Todos» */}
                    <tr
                        onClick={() => onSelect('todos')}
                        className={`cursor-pointer transition-colors ${filtroActivo === 'todos'
                            ? 'bg-[#2B378A] text-white'
                            : 'hover:bg-blue-50'
                            }`}
                    >
                        <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                            <Icon name="filter_list" className="text-[1rem]" />
                            Todos
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                            {formatNumero(data.reduce((s, d) => s + d.cantidad, 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">100%</td>
                    </tr>
                    {data.map((item) => {
                        const f = TIPO_A_FILTRO[item.tipo_novedad];
                        const activo = filtroActivo === f;
                        return (
                            <tr
                                key={item.tipo_novedad}
                                onClick={() => f && onSelect(f)}
                                className={`cursor-pointer transition-colors ${activo
                                    ? 'bg-blue-50 border-l-4 border-l-[#2B378A]'
                                    : 'hover:bg-gray-50/80'
                                    }`}
                            >
                                <td className={`py-2.5 px-3 font-medium flex items-center gap-2 ${activo ? 'text-[#2B378A] font-semibold' : TIPO_COLOR[item.tipo_novedad] ?? 'text-gray-700'
                                    }`}>
                                    <Icon
                                        name={FILTROS[f ?? 'todos']?.icon ?? 'circle'}
                                        className="text-[1rem]"
                                    />
                                    {item.tipo_novedad}
                                </td>
                                <td className={`py-2.5 px-3 text-right ${activo ? 'text-[#2B378A] font-bold' : 'text-gray-600'
                                    }`}>{formatNumero(item.cantidad)}</td>
                                <td className={`py-2.5 px-3 text-right ${activo ? 'text-[#2B378A] font-bold' : 'text-gray-500'
                                    }`}>
                                    <span className="font-semibold">{formatPct(item.pct_total)}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Badge de cantidad con color ──────────────────────────────────────────────
function CantidadBadge({ cantidad, pct, tipo }: { cantidad: number; pct: number; tipo: 'rojo' | 'amarillo' | 'todos' }) {
    if (cantidad === 0) return <span className="text-gray-400 text-xs">—</span>;

    const styles: Record<string, string> = {
        rojo: 'bg-red-50 text-red-700',
        amarillo: 'bg-yellow-50 text-yellow-700',
        todos: 'bg-gray-100 text-gray-700',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${styles[tipo]}`}>
            {cantidad}
            <span className="opacity-60">({formatPct(pct)})</span>
        </span>
    );
}

// ─── Tabla de usuarios dinámica ───────────────────────────────────────────────
function TablaUsuarios({ data, filtro, navigate, dateRange }: { data: UsuarioNovedad[]; filtro: FiltroNovedad; navigate: ReturnType<typeof useNavigate>; dateRange: { dateFrom?: string; dateTo?: string } }) {
    const filtroConf = FILTROS[filtro];

    // Respetar el orden que envía el backend; solo filtrar filas con datos en el tipo seleccionado
    const filtradas = filtro === 'todos'
        ? data
        : data.filter(row => getCantidadFiltro(row, filtro) > 0);

    const mostrarColumna = (col: FiltroNovedad) =>
        filtro === 'todos' || filtro === col || (filtro === 'graves' && (col === 'error_proceso' || col === 'cierre_forzoso')) ||
        (filtro === 'leves' && (col === 'error_informativo' || col === 'novedad_asignada' || col === 'novedad_resuelta'));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Regional</th>
                        <th className="py-3 px-4 text-right">Tickets</th>
                        {/* Columnas graves */}
                        {mostrarColumna('error_proceso') && (
                            <th className="py-3 px-4 text-right text-red-200">🔴 Error Proc.</th>
                        )}
                        {mostrarColumna('cierre_forzoso') && (
                            <th className="py-3 px-4 text-right text-red-200">🔴 C. Forzoso</th>
                        )}
                        {/* Columnas leves */}
                        {mostrarColumna('error_informativo') && (
                            <th className="py-3 px-4 text-right text-yellow-200">🟡 Error Info.</th>
                        )}
                        {mostrarColumna('novedad_asignada') && (
                            <th className="py-3 px-4 text-right text-yellow-200">🟡 Nov. Asig.</th>
                        )}
                        {mostrarColumna('novedad_resuelta') && (
                            <th className="py-3 px-4 text-right text-yellow-200">🟡 Nov. Res.</th>
                        )}
                        <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filtradas.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="py-10 text-center text-gray-500 text-sm">
                                No hay usuarios con {filtroConf.label.toLowerCase()} registrados.
                            </td>
                        </tr>
                    ) : (
                        filtradas.map((row, idx) => (
                            <tr
                                key={`${row.usuario_id}-${idx}`}
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    if (dateRange.dateFrom) params.set('dateFrom', dateRange.dateFrom);
                                    if (dateRange.dateTo) params.set('dateTo', dateRange.dateTo);
                                    const query = params.toString();
                                    navigate(`/reports/dashboard/usuario/${row.usuario_id}${query ? `?${query}` : ''}`);
                                }}
                                className={`cursor-pointer hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                            >
                                <td className="py-3 px-4 text-sm font-semibold text-gray-900">{row.usuario_nombre}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{row.regional}</td>
                                <td className="py-3 px-4 text-sm text-right text-gray-700 font-semibold">{formatNumero(row.total_asignaciones)}</td>
                                {mostrarColumna('error_proceso') && (
                                    <td className="py-3 px-4 text-right">
                                        <CantidadBadge cantidad={row.cant_error_proceso} pct={row.pct_error_proceso} tipo="rojo" />
                                    </td>
                                )}
                                {mostrarColumna('cierre_forzoso') && (
                                    <td className="py-3 px-4 text-right">
                                        <CantidadBadge cantidad={row.cant_cierre_forzoso} pct={row.pct_cierre_forzoso} tipo="rojo" />
                                    </td>
                                )}
                                {mostrarColumna('error_informativo') && (
                                    <td className="py-3 px-4 text-right">
                                        <CantidadBadge cantidad={row.cant_error_informativo} pct={row.pct_error_informativo} tipo="amarillo" />
                                    </td>
                                )}
                                {mostrarColumna('novedad_asignada') && (
                                    <td className="py-3 px-4 text-right">
                                        <CantidadBadge cantidad={row.cant_novedad_asignada} pct={row.pct_novedad_asignada} tipo="amarillo" />
                                    </td>
                                )}
                                {mostrarColumna('novedad_resuelta') && (
                                    <td className="py-3 px-4 text-right">
                                        <CantidadBadge cantidad={row.cant_novedad_resuelta} pct={row.pct_novedad_resuelta} tipo="amarillo" />
                                    </td>
                                )}
                                <td className="py-3 px-4">
                                    <div className="flex justify-center">
                                        <ClasificacionDot clasificacion={getClasifFiltro(row, filtro)} />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}



// ─── Página principal ─────────────────────────────────────────────────────────
export default function Novedades() {
    const navigate = useNavigate();
    const { dateRange, setDateRange } = useDateFilter();
    const { data, isLoading, isError, refetch } = useNovedades(dateRange);
    const { setTitle } = useLayout();
    const [filtro, setFiltro] = useState<FiltroNovedad>('todos');

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar novedades"
                    description="No se pudieron cargar los datos de novedades. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    const usuarios = data?.usuarios_con_mas_novedades ?? [];

    return (
        <div className="flex min-h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Análisis de Novedades"
                subtitle="Distribución de errores e incidencias reportadas por los usuarios."
                icon={<Icon name="bug_report" className="text-2xl" />}
            >
                <FiltroFecha value={dateRange} onChange={setDateRange} />
            </ReportHeader>

            {/* ── Content ───────────────────────────────────────── */}
            <div className="flex-1 px-6 py-6 lg:px-8 flex flex-col gap-6">

                {isLoading ? (
                    <div className="flex flex-col gap-6">
                        <LoadingSkeleton rows={4} />
                        <LoadingSkeleton rows={6} />
                    </div>
                ) : (
                    <>
                        {/* ── Row 1: Pie + Tabla distribución / Tabla usuarios (apiladas) ── */}
                        <div className="flex flex-col gap-6">

                            {/* Izquierda — Distribución por tipo (clickeable) */}
                            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Distribución por Tipo
                                    </h3>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Icon name="touch_app" className="text-[1rem]" />
                                        Haz clic para filtrar
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">
                                    Proporción de cada tipo de novedad sobre el total registrado.
                                </p>

                                {data?.distribucion_tipos && data.distribucion_tipos.length > 0 ? (
                                    <>
                                        <PieNovedades data={data.distribucion_tipos} />
                                        <TablaTipos
                                            data={data.distribucion_tipos}
                                            filtroActivo={filtro}
                                            onSelect={setFiltro}
                                        />
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                                        Sin datos de distribución.
                                    </div>
                                )}
                            </div>

                            {/* Derecha — Tabla dinámica de usuarios */}
                            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800">
                                            Usuarios con {FILTROS[filtro].label}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Top 15 · Ordenados por cantidad del tipo seleccionado.
                                        </p>
                                    </div>
                                </div>

                                {usuarios.length > 0 ? (
                                    <TablaUsuarios data={usuarios} filtro={filtro} navigate={navigate} dateRange={dateRange} />
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                                        Sin usuarios con novedades registradas.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Nota informativa al pie ───────────────────────── */}
                        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
                            <Icon name="warning" className="text-amber-500 mt-0.5 shrink-0 text-[1.1rem]" />
                            <p>
                                Los <strong>Errores Graves</strong> (Error de Proceso y Cierre Forzoso) impactan directamente el score de desempeño.
                                Los usuarios con <strong>≥15% de tickets con errores graves</strong> requieren atención
                                prioritaria. Use los filtros superiores para analizar cada tipo de incidencia por separado.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
