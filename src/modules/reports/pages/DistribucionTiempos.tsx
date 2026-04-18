
import React, { useEffect, useMemo, useState } from 'react';
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
import { CategoryPath } from '../components/ui/CategoryPath';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';

export default function DistribucionTiempos() {
    const { dateRange, setDateRange } = useDateFilter();
    const { data, isLoading, isError, refetch } = useDistribucion(dateRange);
    const { setTitle } = useLayout();

    const [selectedRango, setSelectedRango] = useState<{rango: string; orden: number} | null>(null);
    const [rangoPage, setRangoPage] = useState(1);
    const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
    const [ticketPasosPage, setTicketPasosPage] = useState(1);

    const { data: rangoTicketsData, isLoading: loadingRangoTickets } = useTicketsPorRango(
        selectedRango?.rango ?? undefined,
        selectedRango?.orden,
        dateRange,
        20,
        rangoPage
    );

    const { data: pasosData, isLoading: loadingPasos } = usePasosDeTicket(
        expandedTicket ?? undefined,
        dateRange,
        20,
        ticketPasosPage
    );

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    const insights = useMemo(() => {
        if (!data?.estadisticas || !data?.rangos || data.rangos.length === 0) return null;

        const { media, desviacion_std, minimo, maximo } = data.estadisticas;
        const total = data.estadisticas.total_registros;

        const moda = data.rangos.reduce((prev: RangoTiempo, current: RangoTiempo) => (prev.cantidad > current.cantidad) ? prev : current);

        const pctFrecuente = total > 0
            ? (moda.cantidad / total) * 100
            : 0;

        const inconsistente = desviacion_std > media;

        const ticketsLentos = data.rangos
            .filter((r: RangoTiempo) => r.orden >= 6)
            .reduce((sum: number, r: RangoTiempo) => sum + r.cantidad, 0);

        const pctLentos = total > 0 ? (ticketsLentos / total) * 100 : 0;

        const ticketsCriticos = data.rangos.find((r: RangoTiempo) => r.orden === 7)?.cantidad || 0;
        const pctCriticos = total > 0 ? (ticketsCriticos / total) * 100 : 0;

        return {
            tiempoMedio: media,
            desviacion: desviacion_std,
            minimo,
            maximo,
            rangoFrecuente: moda.rango_horas,
            pctFrecuente: pctFrecuente,
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

            <div className="flex flex-col gap-6 px-6 pt-2 pb-16 lg:px-8">

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

                {!isLoading && insights && (
                    <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-indigo-100/50 bg-white/50 flex items-center gap-2">
                            <Icon name="tips_and_updates" className="text-indigo-600 text-xl" />
                            <h3 className="text-base font-semibold text-slate-800">
                                Resumen Ejecutivo
                            </h3>
                        </div>
                        <div className="p-6 text-sm text-slate-700 leading-relaxed space-y-4">

                            <p className="flex items-start gap-2">
                                <Icon name="info" className="text-indigo-400 text-lg shrink-0 mt-0.5" />
                                <span>
                                    En los últimos 30 días, se analizaron <strong>{formatNumero(insights.total)} resoluciones</strong>.
                                    En promedio, cada paso toma <strong>{insights.tiempoMedio}h</strong>.
                                    El caso más rápido se resolvió en <strong>{insights.minimo}h</strong>,
                                    mientras que el más lento tardó <strong>{insights.maximo}h</strong>.
                                </span>
                            </p>

                            <p className="flex items-start gap-2">
                                <Icon name="bolt" className="text-amber-500 text-lg shrink-0 mt-0.5" />
                                <span>
                                    El <strong>{insights.pctFrecuente.toFixed(1)}%</strong> de los tickets se ha resuelto en el rango más frecuente (<strong>{insights.rangoFrecuente}</strong>).
                                </span>
                            </p>

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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

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
                                            <td colSpan={4} className="py-8">
                                                <EmptyState icon="inbox" title="Sin datos" description="Sin datos de distribución de tiempos." />
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
                        {!isLoading && data?.estadisticas && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-500">
                                Total Registros Computados: <span className="font-semibold text-gray-800">{formatNumero(data.estadisticas.total_registros)}</span>
                            </div>
                        )}
                    </div>
                </div>

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
                                            {/* ✅ CORRECCIÓN: Se reemplaza <> sin key por React.Fragment con key */}
                                            {rangoTicketsData.data.map((ticket) => (
                                                <React.Fragment key={ticket.id}>
                                                    <tr
                                                        onClick={() => {
                                                            if (expandedTicket !== ticket.id) setTicketPasosPage(1);
                                                            setExpandedTicket(prev => prev === ticket.id ? null : ticket.id);
                                                        }}
                                                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${expandedTicket === ticket.id ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <td className="py-3 px-4 text-brand-teal font-medium hover:underline">
                                                            #{ticket.id}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-800 max-w-xs truncate">
                                                            {ticket.titulo}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <StatusBadge estado={ticket.estado} />
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600">
                                                            <CategoryPath categoria={ticket.categoria} subcategoria={ticket.subcategoria} />
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                                (ticket.veces_asignado ?? 0) > 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {ticket.veces_asignado ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-700 font-medium">
                                                            {typeof ticket.duracion_horas === 'number' && ticket.duracion_horas < 1
                                                                ? `${Math.round(ticket.duracion_horas * 60)}m`
                                                                : typeof ticket.duracion_horas === 'number' ? `${ticket.duracion_horas.toFixed(1)}h` : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-500 text-sm">
                                                            {formatFecha(ticket.fechaCreacion)}
                                                        </td>
                                                    </tr>
                                                    {expandedTicket === ticket.id && (
                                                        <tr>
                                                            <td colSpan={7} className="p-0 bg-gray-50 border-t border-dashed border-gray-300">
                                                                <div className="px-6 py-3">
                                                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                                                        Pasos del ticket #{ticket.id}
                                                                        {loadingPasos && <span className="ml-2 text-gray-400 font-normal">(Cargando...)</span>}
                                                                    </p>
                                                                    {pasosData && pasosData.data.length > 0 ? (
                                                                        <>
                                                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                                                <table className="w-full text-left border-collapse text-xs">
                                                                                    <thead>
                                                                                        <tr className="bg-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                                                                                            <th className="py-2 px-3">#</th>
                                                                                            <th className="py-2 px-3">Asignado</th>
                                                                                            <th className="py-2 px-3">Paso</th>
                                                                                            <th className="py-2 px-3 text-right">Tiempo</th>
                                                                                            <th className="py-2 px-3 text-center">Estado</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                                                        {pasosData.data.map((paso, idx) => (
                                                                                            <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                                                                                <td className="py-2 px-3">
                                                                                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600'}`}>
                                                                                                        {idx + 1}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-gray-700 font-medium">
                                                                                                    {paso.asignadoNombre}
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-gray-500">
                                                                                                    {paso.paso}
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-right text-gray-700 font-medium">
                                                                                                    {paso.duracion_horas < 1
                                                                                                        ? `${Math.round(paso.duracion_horas * 60)}m`
                                                                                                        : `${paso.duracion_horas.toFixed(1)}h`}
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-center">
                                                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                                                                                        paso.estadoTiempo === 'A Tiempo' ? 'bg-green-100 text-green-700' :
                                                                                                        paso.estadoTiempo === 'Vencido' ? 'bg-red-100 text-red-700' :
                                                                                                        paso.estadoTiempo === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                        paso.estadoTiempo === 'En curso' ? 'bg-blue-100 text-blue-700' :
                                                                                                        'bg-gray-100 text-gray-600'
                                                                                                    }`}>
                                                                                                        {paso.estadoTiempo}
                                                                                                    </span>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                            {pasosData.totalPages > 1 && (
                                                                                <div className="mt-3">
                                                                                    <Pagination
                                                                                        page={ticketPasosPage}
                                                                                        totalPages={pasosData.totalPages}
                                                                                        onPageChange={setTicketPasosPage}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-400 italic text-center py-4">
                                                                            No se encontraron pasos para este ticket.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rangoTicketsData.totalPages > 1 && (
                                    <Pagination page={rangoPage} totalPages={rangoTicketsData.totalPages} onPageChange={setRangoPage} />
                                )}
                            </>
                        ) : (
                            <EmptyState icon="confirmation_number" title="Sin tickets" description="No hay tickets para este rango en el período seleccionado." />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}