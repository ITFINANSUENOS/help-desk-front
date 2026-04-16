import React, { useEffect, useState } from 'react';
import { useCuellos, useTicketsPorPaso } from '../hooks/useDashboard';
import { BarChartCuellos } from '../components/charts/BarChartCuellos';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatHoras, formatPct } from '../utils/formatters';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { ReportHeader } from '../components/ui/ReportHeader';
import { TicketTable } from '../components/ui/TicketTable';

const LIMIT_OPTIONS = [10, 20, 30, 50] as const;

/** Badge de severidad coloreado */
const SeveridadBadge = ({ severidad }: { severidad: 'critico' | 'moderado' | 'normal' }) => {
    const styles = {
        critico: 'bg-red-50 text-red-700 border border-red-200',
        moderado: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        normal: 'bg-green-50 text-green-700 border border-green-200',
    } as const;

    const labels = {
        critico: 'Crítico',
        moderado: 'Moderado',
        normal: 'Normal',
    } as const;

    if (!severidad) return <span className="text-gray-400">-</span>;

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${styles[severidad]}`}>
            {labels[severidad]}
        </span>
    );
};

export default function CuellosBottleneck() {
    const [limit, setLimit] = useState<typeof LIMIT_OPTIONS[number]>(20);
    const { dateRange, setDateRange } = useDateFilter();
    const { data, isLoading, isError, refetch } = useCuellos(limit, dateRange);
    const { setTitle } = useLayout();

    // Fila expandida (accordion)
    const [expandedPaso, setExpandedPaso] = useState<string | null>(null);

    const { data: pasoTicketsData, isLoading: loadingPasoTickets } = useTicketsPorPaso(
        expandedPaso ?? undefined,
        dateRange,
        20
    );

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar cuellos de botella"
                    description="No se pudieron cargar los datos. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    // Ordenar por duración promedio desc
    const sortedData = data
        ? [...data].sort((a, b) => Number(b.duracion_promedio) - Number(a.duracion_promedio))
        : [];

    return (
        <div className="flex min-h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Cuellos de Botella"
                subtitle="Pasos del flujo con mayor duración promedio y tasa de atrasos."
                icon={<Icon name="hourglass_empty" className="text-2xl" />}
            >
                <div className="flex items-center gap-2 text-sm shrink-0">
                    <span className="text-gray-500 font-medium">Mostrar top</span>
                    <select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value) as typeof LIMIT_OPTIONS[number])}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#43BBCA] bg-white cursor-pointer"
                    >
                        {LIMIT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <FiltroFecha value={dateRange} onChange={setDateRange} />
            </ReportHeader>

            {/* Contenido */}
            <div className="flex flex-col gap-6 px-6 pt-2 pb-16 lg:px-8 max-w-[1600px] w-full mx-auto">

                {/* ── Gráfico ──────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Icon name="insert_chart" className="text-gray-400 text-xl" />
                        Duración Promedio por Paso (horas)
                    </h3>
                    {isLoading ? (
                        <LoadingSkeleton className="h-[400px]" />
                    ) : sortedData.length === 0 ? (
                        <EmptyState icon="inbox" title="Sin datos" description="Sin datos para mostrar." />
                    ) : (
                        <BarChartCuellos data={sortedData} />
                    )}
                </div>

                {/* ── Tabla Detalle ───────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-[#FAFAFA]">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <Icon name="table_chart" className="text-gray-400 text-xl" />
                            Detalle por Paso
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                    <th className="py-3.5 px-4">Paso</th>
                                    <th className="py-3.5 px-4 text-right">Ocurr.</th>
                                    <th className="py-3.5 px-4 text-right">Dur. Prom</th>
                                    <th className="py-3.5 px-4 text-right">% Atrasos</th>
                                    <th className="py-3.5 px-4 text-center">Severidad</th>
                                    <th className="py-3.5 px-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-4"><LoadingSkeleton rows={5} /></td>
                                    </tr>
                                ) : sortedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8">
                                            <EmptyState icon="inbox" title="Sin datos" description="No hay datos de cuellos de botella." />
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((item, idx) => {
                                        const isExpanded = expandedPaso === item.paso_flujo;
                                        return (
                                            <React.Fragment key={idx}>
                                                <tr
                                                    onClick={() => setExpandedPaso(isExpanded ? null : item.paso_flujo)}
                                                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${isExpanded ? 'bg-teal-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Icon
                                                                name={isExpanded ? 'expand_less' : 'expand_more'}
                                                                className="text-gray-400 text-xl"
                                                            />
                                                            <span className="font-medium text-gray-800 max-w-[200px] truncate" title={item.paso_flujo}>
                                                                {item.paso_flujo}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-gray-600">
                                                        {Number(item.total_asignaciones).toLocaleString('es-CO')}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-gray-700 font-medium">
                                                        {formatHoras(Number(item.duracion_promedio))}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-gray-600">
                                                        {formatPct(Number(item.pct_atrasados))}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <SeveridadBadge severidad={item.severidad} />
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setExpandedPaso(isExpanded ? null : item.paso_flujo); }}
                                                            className="text-xs text-[#43BBCA] hover:text-[#2B378A] font-medium"
                                                        >
                                                            {isExpanded ? 'Ocultar' : 'Ver tickets'}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Accordion: Tickets del paso */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6} className="p-0 bg-gray-50 border-t-2 border-teal-200">
                                                            <div className="px-6 py-4">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <p className="text-sm font-semibold text-gray-700">
                                                                        Tickets del paso: <span className="text-teal-700">{item.paso_flujo}</span>
                                                                    </p>
                                                                    {loadingPasoTickets && (
                                                                        <span className="text-xs text-gray-400">Cargando...</span>
                                                                    )}
                                                                </div>

                                                                {loadingPasoTickets ? (
                                                                    <LoadingSkeleton rows={3} />
                                                                ) : pasoTicketsData?.data && pasoTicketsData.data.length > 0 ? (
                                                                    <>
                                                                        <TicketTable tickets={pasoTicketsData.data} emptyMessage="No hay tickets para este paso..." />
                                                                    </>
                                                                ) : (
                                                                    <EmptyState icon="confirmation_number" title="Sin tickets" description="No hay tickets para este paso en el período seleccionado." />
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {!isLoading && sortedData.length > 0 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-500">
                            Top {sortedData.length} pasos con mayor duración
                        </div>
                    )}
                </div>

                {/* ── Leyenda ─────────────────────────────────────── */}
                {!isLoading && sortedData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Criterios de severidad</p>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-semibold text-red-700">Crítico:</span> ≥ 100 hrs
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-semibold text-yellow-700">Moderado:</span> ≥ 50 hrs
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-semibold text-green-700">Normal:</span> &lt; 50 hrs
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
