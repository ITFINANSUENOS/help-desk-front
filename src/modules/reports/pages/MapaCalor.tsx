import { useEffect, useState, useMemo } from 'react';
import { useMapaCalor, useRegionales } from '../hooks/useDashboard';
import { FiltroRegional } from '../components/ui/FiltroRegional';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatHoras, formatPct, formatNumero } from '../utils/formatters';
import {
    COLORES_SISTEMA,
    getClasificacionCumplimiento,
    getClasificacionTiempo,
    getColorErroresGraves,
    getColorErroresLeves,
} from '../utils/colores';

/** Retorna estilos inline para las celdas del mapa de calor */
function celda(clasificacion: 'verde' | 'amarillo' | 'rojo') {
    const c = COLORES_SISTEMA[clasificacion];
    return { backgroundColor: c.bg, color: c.text };
}

export default function MapaCalor() {
    const [selectedRegional, setSelectedRegional] = useState<string | undefined>();
    const { dateRange, setDateRange } = useDateFilter();

    const { data, isLoading, isError, refetch } = useMapaCalor(selectedRegional, dateRange);
    const { data: regionalesData } = useRegionales(dateRange);
    const { setTitle } = useLayout();

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    const listRegionales = useMemo(() => {
        if (!regionalesData) return [];
        return regionalesData.map(r => r.regional).sort();
    }, [regionalesData]);

    /** Todos los tiempos para cálculo de percentil */
    const todosTiempos = useMemo(
        () => (data ?? []).map(u => u.tiempo_promedio),
        [data]
    );

    /** Agrupar usuarios por regional respetando el orden del backend */
    const gruposPorRegional = useMemo(() => {
        if (!data) return [];
        const map = new Map<string, typeof data>();
        for (const item of data) {
            if (!map.has(item.regional)) map.set(item.regional, []);
            map.get(item.regional)!.push(item);
        }
        return Array.from(map.entries());
    }, [data]);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar el mapa de calor"
                    description="No se pudieron cargar los datos del mapa de calor. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-gray-50/50">

            {/* ── Sticky Header ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 lg:px-8 border-b border-gray-100 bg-white/60 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center p-3 bg-red-50 rounded-xl text-red-600 shadow-sm border border-red-100">
                        <Icon name="local_fire_department" className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Mapa de Calor</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Visualización de rendimiento individual por usuario y regional.
                        </p>
                    </div>
                </div>

                {/* Filtro de regional alineado a la derecha */}
                <div className="flex flex-wrap items-center gap-3">
                    <FiltroFecha value={dateRange} onChange={setDateRange} />
                    <div className="w-full sm:w-56 shrink-0">
                        <FiltroRegional
                            value={selectedRegional}
                            onChange={setSelectedRegional}
                            regionales={listRegionales}
                            placeholder="Todas las regionales"
                        />
                    </div>
                </div>
            </div>

            {/* ── Contenido ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 px-6 pt-2 pb-16 lg:px-8">

                {/* Leyenda */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Colores de celda:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORES_SISTEMA.verde.bg }} />
                        <span style={{ color: COLORES_SISTEMA.verde.text }}>✓ Bueno</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORES_SISTEMA.amarillo.bg }} />
                        <span style={{ color: COLORES_SISTEMA.amarillo.text }}>⚠ Atención</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORES_SISTEMA.rojo.bg }} />
                        <span style={{ color: COLORES_SISTEMA.rojo.text }}>✗ Crítico</span>
                    </div>
                    <span className="text-gray-400 ml-2">
                        🔴 Err. Graves: &gt;5% = rojo · &nbsp;🟡 Err. Leves: &gt;25% = rojo
                    </span>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><LoadingSkeleton rows={10} /></div>
                    ) : !data || data.length === 0 ? (
                        <div className="py-16 text-center text-gray-500 text-sm">
                            No hay datos disponibles para los filtros seleccionados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Usuario</th>
                                        <th className="py-3 px-4 text-right">Tickets</th>
                                        <th className="py-3 px-4 text-right">% SLA</th>
                                        <th className="py-3 px-4 text-right text-red-200">🔴 Err. Graves</th>
                                        <th className="py-3 px-4 text-right text-yellow-200">🟡 Err. Leves</th>
                                        <th className="py-3 px-4 text-right">T. Prom.</th>
                                        <th className="py-3 px-4 text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gruposPorRegional.map(([regional, usuarios]) => (
                                        <>
                                            {/* Separador de regional */}
                                            <tr key={`header-${regional}`}>
                                                <td
                                                    colSpan={8}
                                                    className="py-2 px-4 text-xs font-bold uppercase tracking-widest text-white"
                                                    style={{ backgroundColor: '#2B378A' }}
                                                >
                                                    📍 {regional}
                                                </td>
                                            </tr>

                                            {/* Filas de usuarios */}
                                            {usuarios.map((u, idx) => {
                                                const claSla = getClasificacionCumplimiento(u.pct_cumplimiento_sla);
                                                const claGraves = getColorErroresGraves(u.pct_errores_graves);
                                                const claLeves = getColorErroresLeves(u.pct_errores_leves);
                                                const claTiempo = getClasificacionTiempo(u.tiempo_promedio, todosTiempos);

                                                return (
                                                    <tr
                                                        key={`${regional}-${u.usuario_id}-${idx}`}
                                                        className="border-b border-gray-100 hover:brightness-95 transition-all"
                                                    >
                                                        {/* Ranking */}
                                                        <td className="py-2.5 px-4 text-xs text-gray-400 font-semibold">
                                                            {u.ranking}
                                                        </td>

                                                        {/* Usuario */}
                                                        <td className="py-2.5 px-4 font-medium text-gray-900">
                                                            {u.usuario_nombre}
                                                        </td>

                                                        {/* Tickets */}
                                                        <td className="py-2.5 px-4 text-right text-gray-700">
                                                            {formatNumero(u.tickets_gestionados)}
                                                        </td>

                                                        {/* % SLA — coloreado */}
                                                        <td
                                                            className="py-2.5 px-4 text-right font-semibold"
                                                            style={celda(claSla)}
                                                        >
                                                            {formatPct(u.pct_cumplimiento_sla)}
                                                        </td>

                                                        {/* % Errores Graves — coloreado */}
                                                        <td
                                                            className="py-2.5 px-4 text-right font-semibold"
                                                            style={celda(claGraves)}
                                                        >
                                                            {u.cant_errores_graves > 0
                                                                ? `${u.cant_errores_graves} (${formatPct(u.pct_errores_graves)})`
                                                                : '—'}
                                                        </td>

                                                        {/* % Errores Leves — coloreado */}
                                                        <td
                                                            className="py-2.5 px-4 text-right font-semibold"
                                                            style={celda(claLeves)}
                                                        >
                                                            {u.cant_errores_leves > 0
                                                                ? `${u.cant_errores_leves} (${formatPct(u.pct_errores_leves)})`
                                                                : '—'}
                                                        </td>

                                                        {/* T. Promedio — coloreado por percentil */}
                                                        <td
                                                            className="py-2.5 px-4 text-right font-semibold"
                                                            style={celda(claTiempo)}
                                                        >
                                                            {formatHoras(u.tiempo_promedio)}
                                                        </td>

                                                        {/* Score total */}
                                                        <td className="py-2.5 px-4 text-center">
                                                            <ScoreBadge score={u.score_total} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
