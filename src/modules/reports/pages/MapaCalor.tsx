import { useState, useMemo } from 'react';
import { useMapaCalor } from '../hooks/useDashboard';
import { useRegionales } from '../hooks/useDashboard';
import { FiltroRegional } from '../components/ui/FiltroRegional';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatPct } from '../utils/formatters';
import { COLORES_SISTEMA, getClasificacionCumplimiento, getClasificacionErrores, getClasificacionTiempo } from '../utils/colores';
import { IconFlame } from '@tabler/icons-react';

/** Devuelve estilos inline según la clasificación para la celda de mapa de calor */
function celda(clasificacion: 'verde' | 'amarillo' | 'rojo') {
    const c = COLORES_SISTEMA[clasificacion];
    return { backgroundColor: c.bg, color: c.text };
}

export default function MapaCalor() {
    const [selectedRegional, setSelectedRegional] = useState<string | undefined>();

    const { data, isLoading, isError, refetch } = useMapaCalor(selectedRegional);
    const { data: regionalesData } = useRegionales();

    // Lista de regionales para el filtro
    const listRegionales = useMemo(() => {
        if (!regionalesData) return [];
        return regionalesData.map(r => r.regional).sort();
    }, [regionalesData]);

    // Todos los tiempos promedio para calcular percentiles
    const todosTiempos = useMemo(
        () => (data ?? []).map(u => Number(u.tiempo_promedio)),
        [data]
    );

    // Agrupar datos por regional
    const gruposPorRegional = useMemo(() => {
        if (!data) return [];
        const map = new Map<string, typeof data>();
        for (const item of data) {
            if (!map.has(item.regional)) map.set(item.regional, []);
            map.get(item.regional)!.push(item);
        }
        return Array.from(map.entries()); // [regional, items[]]
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
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                        <IconFlame size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Mapa de Calor</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Visualización de rendimiento individual por usuario y regional.
                        </p>
                    </div>
                </div>
                <div className="w-full sm:w-56">
                    <FiltroRegional
                        value={selectedRegional}
                        onChange={setSelectedRegional}
                        regionales={listRegionales}
                        placeholder="Todas las regionales"
                    />
                </div>
            </div>

            {/* Leyenda */}
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-600">
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
                                    <th className="py-3 px-4">Usuario</th>
                                    <th className="py-3 px-4 text-right">Tickets</th>
                                    <th className="py-3 px-4 text-right">% SLA</th>
                                    <th className="py-3 px-4 text-right">% Errores</th>
                                    <th className="py-3 px-4 text-right">T. Promedio</th>
                                    <th className="py-3 px-4 text-center">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gruposPorRegional.map(([regional, usuarios]) => (
                                    <>
                                        {/* Separador de regional */}
                                        <tr key={`header-${regional}`}>
                                            <td
                                                colSpan={6}
                                                className="py-2 px-4 text-xs font-bold uppercase tracking-widest text-white"
                                                style={{ backgroundColor: '#2B378A' }}
                                            >
                                                📍 {regional}
                                            </td>
                                        </tr>

                                        {/* Filas de usuarios en esa regional */}
                                        {usuarios.map((u, idx) => {
                                            const claSla = getClasificacionCumplimiento(Number(u.pct_cumplimiento_sla));
                                            const claErr = getClasificacionErrores(Number(u.pct_total_errores));
                                            const claTiempo = getClasificacionTiempo(Number(u.tiempo_promedio), todosTiempos);

                                            return (
                                                <tr
                                                    key={`${regional}-${u.usuario_nombre}-${idx}`}
                                                    className="border-b border-gray-100 hover:brightness-95 transition-all"
                                                >
                                                    {/* Usuario */}
                                                    <td className="py-2.5 px-4 font-medium text-gray-900">
                                                        {u.usuario_nombre}
                                                    </td>

                                                    {/* Tickets — sin color especial */}
                                                    <td className="py-2.5 px-4 text-right text-gray-700">
                                                        {u.tickets_gestionados}
                                                    </td>

                                                    {/* % SLA — coloreado */}
                                                    <td
                                                        className="py-2.5 px-4 text-right font-semibold"
                                                        style={celda(claSla)}
                                                    >
                                                        {formatPct(Number(u.pct_cumplimiento_sla))}
                                                    </td>

                                                    {/* % Errores totales — coloreado (invertido) */}
                                                    <td
                                                        className="py-2.5 px-4 text-right font-semibold"
                                                        style={celda(claErr)}
                                                    >
                                                        {formatPct(Number(u.pct_total_errores))}
                                                    </td>

                                                    {/* T. Promedio — coloreado por percentil */}
                                                    <td
                                                        className="py-2.5 px-4 text-right font-semibold"
                                                        style={celda(claTiempo)}
                                                    >
                                                        {formatHoras(Number(u.tiempo_promedio))}
                                                    </td>

                                                    {/* Score */}
                                                    <td className="py-2.5 px-4 text-center">
                                                        <ScoreBadge score={Number(u.score_total)} />
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
    );
}
