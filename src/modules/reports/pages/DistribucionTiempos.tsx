import { useEffect, useMemo, useState } from 'react';
import { useDistribucion, useTicketsPorRango, usePasosDeTicket } from '../hooks/useDashboard';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { KPICard } from '../components/ui/KPICard';
import { HistogramaTiempos } from '../components/charts/HistogramaTiempos';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatNumero, formatPct, formatFecha } from '../utils/formatters';
import type { RangoTiempo } from '../types/dashboard.types';
import { ReportHeader } from '../components/ui/ReportHeader';

export default function DistribucionTiempos() {
    const { dateRange, setDateRange } = useDateFilter();
    const { data, isLoading, isError, refetch } = useDistribucion(dateRange);
    const { setTitle } = useLayout();

    const [selectedRango, setSelectedRango] = useState<{rango: string; orden: number} | null>(null);
    const [rangoPage, setRangoPage] = useState(1);
    const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

    const { data: rangoTicketsData, isLoading: loadingRangoTickets } = useTicketsPorRango(
        selectedRango?.rango ?? undefined,
        selectedRango?.orden,
        dateRange,
        20,
        rangoPage
    );

    const { data: pasosData, isLoading: loadingPasos } = usePasosDeTicket(
        expandedTicket ?? undefined,
        dateRange
    );

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
        const moda = data.rangos.reduce((prev: RangoTiempo, current: RangoTiempo) => (prev.cantidad > current.cantidad) ? prev : current);

        const pctFrecuente = total > 0
            ? (moda.cantidad / total) * 100
            : 0;

        // 1. Variabilidad
        const inconsistente = desviacion_std > media;

        // 2. Diagnóstico Rápido: calcular % de tickets que superan las 72h (3 días)
        const ticketsLentos = data.rangos
            .filter((r: RangoTiempo) => r.orden >= 5) // "1-3 días" es orden 5, usaremos >= 6 para > 3 días, pero el usuario dijo 11.4% (orden 6 y 7 sumados).
            // Ajuste: El backend devuelve orden 6 para "3-7 días" y 7 para "+7 días".
            // Sumaremos cantidad de orden 6 y 7.
            .filter((r: RangoTiempo) => r.orden >= 6)
            .reduce((sum: number, r: RangoTiempo) => sum + r.cantidad, 0);

        const pctLentos = total > 0 ? (ticketsLentos / total) * 100 : 0;

        // Casos críticos (> 7 días -> orden 7)
        const ticketsCriticos = data.rangos.find((r: RangoTiempo) => r.orden === 7)?.cantidad || 0;
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
        <div className="flex min-h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Distribución de Tiempos"
                subtitle="Análisis estadístico de la duración en la resolución de los tickets."
                icon={<Icon name="hourglass_empty" className="text-2xl" />}
            >
                <FiltroFecha value={dateRange} onChange={setDateRange} />
            </ReportHeader>
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
                                        data.rangos.map((row: RangoTiempo, idx: number) => {
                                            const isSelected = selectedRango?.rango === row.rango_horas;
                                            return (
                                                <tr
                                                    key={idx}
                                                    onClick={() => setSelectedRango(prev => (prev?.rango === row.rango_horas) ? null : { rango: row.rango_horas, orden: row.orden })}
                                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                                >
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
                                            );
                                        })
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

                {/* ── Tickets del Rango seleccionado ─────────────────── */}
                {selectedRango && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-teal-50 rounded-lg text-brand-teal">
                                    <Icon name="confirmation_number" className="text-[1.1rem]" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Tickets del rango: {selectedRango.rango}
                                </h3>
                                {loadingRangoTickets && <span className="text-sm text-gray-400">(Cargando...)</span>}
                            </div>
                            <button
                                onClick={() => setSelectedRango(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Icon name="close" className="text-lg" />
                            </button>
                        </div>

                        {loadingRangoTickets ? (
                            <div className="p-6"><LoadingSkeleton rows={5} /></div>
                        ) : rangoTicketsData?.data && rangoTicketsData.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                <th className="py-3 px-4">Ticket</th>
                                                <th className="py-3 px-4">Título</th>
                                                <th className="py-3 px-4">Estado</th>
                                                <th className="py-3 px-4">Categoría</th>
                                                <th className="py-3 px-4 text-center">Veces</th>
                                                <th className="py-3 px-4 text-right">T. Primera</th>
                                                <th className="py-3 px-4 text-right">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rangoTicketsData.data.map((ticket) => (
                                                <>
                                                    <tr
                                                        key={ticket.id}
                                                        onClick={() => setExpandedTicket(prev => prev === ticket.id ? null : ticket.id)}
                                                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${expandedTicket === ticket.id ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <td className="py-3 px-4 text-brand-teal font-medium hover:underline">
                                                            #{ticket.id}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-800 max-w-xs truncate">
                                                            {ticket.titulo}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                ticket.estado === 'Cerrado' ? 'bg-green-100 text-green-700' :
                                                                ticket.estado === 'Pausado' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {ticket.estado}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600">
                                                            {[ticket.categoria, ticket.subcategoria].filter(Boolean).join(' / ')}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                                ticket.veces_asignado > 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {ticket.veces_asignado}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-700 font-medium">
                                                            {ticket.duracion_horas < 1
                                                                ? `${Math.round(ticket.duracion_horas * 60)}m`
                                                                : `${ticket.duracion_horas.toFixed(1)}h`}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-500 text-sm">
                                                            {formatFecha(ticket.fechaCreacion)}
                                                        </td>
                                                    </tr>
                                                    {expandedTicket === ticket.id && (
                                                        <tr key={`${ticket.id}-steps`}>
                                                            <td colSpan={7} className="p-0 bg-gray-50 border-t border-dashed border-gray-300">
                                                                <div className="px-6 py-3">
                                                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                                                        Pasos del ticket #{ticket.id}
                                                                        {loadingPasos && <span className="ml-2 text-gray-400 font-normal">(Cargando...)</span>}
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {pasosData && pasosData.length > 0 ? (
                                                                            pasosData.map((paso, idx) => (
                                                                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded px-3 py-2 border border-gray-100">
                                                                                    <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600'}`}>
                                                                                        {idx + 1}
                                                                                    </span>
                                                                                    <span className="font-medium">{paso.asignadoNombre}</span>
                                                                                    <span className="text-gray-400">•</span>
                                                                                    <span className="text-gray-500">{paso.paso}</span>
                                                                                    <span className="ml-auto text-right">
                                                                                        <span className="text-gray-400 text-[10px]">
                                                                                            {paso.duracion_horas < 1
                                                                                                ? `${Math.round(paso.duracion_horas * 60)}m`
                                                                                                : `${paso.duracion_horas.toFixed(1)}h`}
                                                                                        </span>
                                                                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                                            paso.estadoTiempo === 'A Tiempo' ? 'bg-green-100 text-green-700' :
                                                                                            paso.estadoTiempo === 'Vencido' ? 'bg-red-100 text-red-700' :
                                                                                            paso.estadoTiempo === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                                                                            'bg-gray-100 text-gray-600'
                                                                                        }`}>
                                                                                            {paso.estadoTiempo}
                                                                                        </span>
                                                                                    </span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-xs text-gray-400 italic">No se encontraron pasos para este ticket.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rangoTicketsData.totalPages > 1 && (
                                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            Mostrando {rangoTicketsData.data.length} de {rangoTicketsData.total} tickets
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRangoPage(p => Math.max(1, p - 1))}
                                                disabled={rangoPage === 1}
                                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                            >
                                                Anterior
                                            </button>
                                            <span className="px-3 py-1 text-xs text-gray-600">
                                                {rangoPage} / {rangoTicketsData.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setRangoPage(p => Math.min(rangoTicketsData.totalPages, p + 1))}
                                                disabled={rangoPage === rangoTicketsData.totalPages}
                                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No hay tickets para este rango en el período seleccionado.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
