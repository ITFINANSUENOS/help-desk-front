import { useEffect, useMemo } from 'react';
import { useDistribucion } from '../hooks/useDashboard';
import { KPICard } from '../components/ui/KPICard';
import { HistogramaTiempos } from '../components/charts/HistogramaTiempos';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatNumero, formatPct } from '../utils/formatters';

export default function DistribucionTiempos() {
    const { data, isLoading, isError, refetch } = useDistribucion();
    const { setTitle } = useLayout();

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    // Calcular KPIs estáticos seguros de data
    // ─── Lógica para Insights Analíticos y KPIs ───
    const insights = useMemo(() => {
        if (!data?.estadisticas || !data?.rangos || data.rangos.length === 0) return null;

        const { media, desviacion_std, minimo, maximo } = data.estadisticas;
        const total = data.estadisticas.total_registros;

        // Find the most frequent range (moda)
        const moda = data.rangos.reduce((prev, current) => (prev.cantidad > current.cantidad) ? prev : current);

        const pctFrecuente = total > 0
            ? (moda.cantidad / total) * 100
            : 0;

        // 1. Variabilidad
        const inconsistente = desviacion_std > media;

        // 2. Diagnóstico Rápido: calcular % de tickets que superan las 72h (3 días)
        const ticketsLentos = data.rangos
            .filter(r => r.orden >= 5) // "1-3 días" es orden 5, usaremos >= 6 para > 3 días, pero el usuario dijo 11.4% (orden 6 y 7 sumados).
            // Ajuste: El backend devuelve orden 6 para "3-7 días" y 7 para "+7 días". 
            // Sumaremos cantidad de orden 6 y 7.
            .filter(r => r.orden >= 6)
            .reduce((sum, r) => sum + r.cantidad, 0);

        const pctLentos = total > 0 ? (ticketsLentos / total) * 100 : 0;

        // Casos críticos (> 7 días -> orden 7)
        const ticketsCriticos = data.rangos.find(r => r.orden === 7)?.cantidad || 0;
        const pctCriticos = total > 0 ? (ticketsCriticos / total) * 100 : 0;

        return {
            // Tiempos Clave
            tiempoMedio: media,
            desviacion: desviacion_std,
            minimo,
            maximo,
            rangoFrecuente: moda.rango_horas,
            pctFrecuente: pctFrecuente,

            // Alertas
            inconsistente,
            pctLentos,
            pctCriticos,
            total
        };
    }, [data]);

    if (isError) {
        return (
            <div className="p-8 flex-1 flex flex-col items-center justify-center">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar distribución de tiempos"
                    description="No se pudieron cargar los datos de tiempos. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 -mx-4 md:-mx-8">

            {/* ── Sticky Header ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 lg:px-8 border-b border-gray-100 bg-white/90 backdrop-blur-xl z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center p-3 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                        <Icon name="hourglass_empty" className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Distribución de Tiempos</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Análisis estadístico de la duración en la resolución de los tickets.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Contenido ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 px-6 pt-2 pb-16 lg:px-8">

                {/* ── KPIs ────────────────────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[0, 1, 2].map(i => <LoadingSkeleton key={i} className="h-[104px]" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <KPICard
                            titulo="Tiempo Medio"
                            valor={`${insights?.tiempoMedio || 0}h`}
                            icono="schedule"
                            subtitulo={`Min: ${insights?.minimo || 0}h, Max: ${insights?.maximo || 0}h`}
                        />
                        <KPICard
                            titulo="Rango más frecuente"
                            valor={insights?.rangoFrecuente || 'N/A'}
                            icono="bar_chart"
                            clasificacion="verde"
                            subtitulo={`${(insights?.pctFrecuente || 0).toFixed(1)}% de los tickets`}
                        />
                        <KPICard
                            titulo="Desviación Estándar"
                            valor={`${insights?.desviacion || 0}h`}
                            icono="scatter_plot"
                        />
                    </div>
                )}

                {/* ── Resumen Ejecutivo (Narrativo) ───────────────────────── */}
                {!isLoading && insights && (
                    <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-indigo-100/50 bg-white/50 flex items-center gap-2">
                            <Icon name="tips_and_updates" className="text-indigo-600 text-xl" />
                            <h3 className="text-base font-semibold text-slate-800">
                                Resumen Ejecutivo
                            </h3>
                        </div>
                        <div className="p-6 text-sm text-slate-700 leading-relaxed space-y-4">

                            {/* Bloque 1: Contexto general */}
                            <p className="flex items-start gap-2">
                                <Icon name="info" className="text-indigo-400 text-lg shrink-0 mt-0.5" />
                                <span>
                                    En los últimos 30 días, se analizaron <strong>{formatNumero(insights.total)} resoluciones</strong>.
                                    En promedio, cada paso toma <strong>{insights.tiempoMedio}h</strong>.
                                    El caso más rápido se resolvió en <strong>{insights.minimo}h</strong>,
                                    mientras que el más lento tardó <strong>{insights.maximo}h</strong>.
                                </span>
                            </p>

                            {/* Bloque 2: Casos típicos */}
                            <p className="flex items-start gap-2">
                                <Icon name="bolt" className="text-amber-500 text-lg shrink-0 mt-0.5" />
                                <span>
                                    El <strong>{insights.pctFrecuente.toFixed(1)}%</strong> de los tickets se ha resuelto en el rango más frecuente (<strong>{insights.rangoFrecuente}</strong>).
                                </span>
                            </p>

                            {/* Bloque 3: Alertas condicionales */}
                            {insights.inconsistente && (
                                <p className="flex items-start gap-2">
                                    <Icon name="warning" className="text-orange-500 text-lg shrink-0 mt-0.5" />
                                    <span>
                                        <strong>⚠️ Inconsistencia detectada:</strong> Observamos una alta variabilidad en los tiempos
                                        (desviación de {insights.desviacion}h frente a una media de {insights.tiempoMedio}h).
                                        Esto significa que algunos tickets fluyen rápido pero otros se estancan gravemente. Sugerimos revisar los procesos de estandarización.
                                    </span>
                                </p>
                            )}

                            {insights.pctLentos > 10 && (
                                <p className="flex items-start gap-2">
                                    <Icon name="error" className="text-red-500 text-lg shrink-0 mt-0.5" />
                                    <span>
                                        <strong>⚠️ Posible Cuello de Botella:</strong> El <strong>{insights.pctLentos.toFixed(1)}%</strong> de los pasos tarda más de 3 días en resolverse.
                                        {insights.pctCriticos > 0 && ` Además, el ${insights.pctCriticos.toFixed(1)}% superan una semana entera (casos críticos).`}
                                    </span>
                                </p>
                            )}

                        </div>
                    </div>
                )}

                {/* ── Gráfico y Tabla ────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Izquierda: Histograma (2/3 width) */}
                    <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <Icon name="insert_chart" className="text-gray-400 text-xl" />
                            Histograma de Resolución
                        </h3>
                        {isLoading ? (
                            <LoadingSkeleton className="h-[400px]" />
                        ) : !data?.rangos || data.rangos.length === 0 ? (
                            <div className="flex justify-center items-center h-[400px] text-gray-400">
                                No hay datos de rango disponibles.
                            </div>
                        ) : (
                            <HistogramaTiempos data={data.rangos} />
                        )}
                    </div>

                    {/* Derecha: Tabla resumen (1/3 width) */}
                    <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-[#FAFAFA]">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Icon name="table_chart" className="text-gray-400 text-xl" />
                                Detalle por Rango
                            </h3>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-white text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                                        <th className="py-3 px-4">Rango</th>
                                        <th className="py-3 px-4 text-right">Cantidad</th>
                                        <th className="py-3 px-4 text-right">% Rel.</th>
                                        <th className="py-3 px-4 text-right hidden lg:table-cell">% Acum.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr><td colSpan={4} className="p-4"><LoadingSkeleton rows={5} /></td></tr>
                                    ) : !data?.rangos || data.rangos.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400">
                                                Sin datos
                                            </td>
                                        </tr>
                                    ) : (
                                        data.rangos.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">
                                                    {row.rango_horas}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                                                    {formatNumero(row.cantidad)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-600">
                                                    {formatPct(row.pct_total)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-indigo-600 font-medium hidden lg:table-cell">
                                                    {formatPct(row.pct_acumulado)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer con el total del backend */}
                        {!isLoading && data?.estadisticas && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-500">
                                Total Registros Computados: <span className="font-semibold text-gray-800">{formatNumero(data.estadisticas.total_registros)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
