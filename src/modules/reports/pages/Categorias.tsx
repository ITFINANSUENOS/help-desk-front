import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { useCategorias, useTicketsPorSubcategoria, useTicketsPorCategoria } from '../hooks/useDashboard';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatHoras, formatPct, formatNumero } from '../utils/formatters';
import { getHexClasificacion, getColorErroresGraves } from '../utils/colores';
import type { CategoriaStats, SubcategoriaStats } from '../types/dashboard.types';
import { ReportHeader } from '../components/ui/ReportHeader';
import { TicketTable } from '../components/ui/TicketTable';
import { Pagination } from '../components/ui/Pagination';

/** Tooltip personalizado para el BarChart de categorías primarias */
const CategoriaTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: { categoria: string; pasos_por_ticket: number; pct_con_novedad: number } }>;
}) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm text-sm">
                <p className="font-bold text-slate-800 mb-1 max-w-[180px]">{d.categoria}</p>
                <div className="flex flex-col gap-1">
                    <p className="text-slate-600 flex justify-between gap-4">
                        <span>Pasos/Ticket:</span>
                        <span className="font-semibold text-slate-900">{Number(d.pasos_por_ticket).toFixed(1)}</span>
                    </p>
                    <p className="text-slate-600 flex justify-between gap-4">
                        <span>Con novedad:</span>
                        <span className="font-semibold text-slate-900">{Number(d.pct_con_novedad).toFixed(1)}%</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

/** Trunca texto largo en el eje Y del gráfico */
const truncate = (str: string, max = 28) =>
    str.length > max ? str.slice(0, max) + '…' : str;

export default function Categorias() {
    const { dateRange, setDateRange } = useDateFilter();
    const { data, isLoading, isError, refetch } = useCategorias(dateRange);
    const { setTitle } = useLayout();

    // Set para manejar las categorías expandidas
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Drill-down: categoría/subcategoría seleccionada para ver sus tickets
    const [selectedItemForTickets, setSelectedItemForTickets] = useState<{type: 'categoria' | 'subcategoria'; name: string} | null>(null);
    const [categoriaPage, setCategoriaPage] = useState(1);
    const [subcategoriaExpandedTickets, setSubcategoriaExpandedTickets] = useState<string | null>(null);
    const [subcategoriaPage, setSubcategoriaPage] = useState(1);

    const { data: subcategoriaTicketsData, isLoading: loadingSubcategoriaTickets } = useTicketsPorSubcategoria(
        subcategoriaExpandedTickets ?? undefined,
        dateRange,
        20,
        subcategoriaPage
    );

    const { data: categoriaTicketsData, isLoading: loadingCategoriaTickets } = useTicketsPorCategoria(
        selectedItemForTickets?.type === 'categoria' ? selectedItemForTickets.name : undefined,
        dateRange,
        20,
        categoriaPage
    );

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    // Cuando llegan los datos, expandir la primera por defecto para ejemplificar
    useEffect(() => {
        if (data && data.length > 0 && expandedCategories.size === 0) {
            setExpandedCategories(new Set([data[0].categoria]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    // Drill-down: click en categoría o subcategoría para ver tickets
    const handleVerTickets = (type: 'categoria' | 'subcategoria', name: string) => {
        setSelectedItemForTickets(prev => (prev?.type === type && prev?.name === name) ? null : { type, name });
        setCategoriaPage(1);
    };

    // Toggle expand/collapse de subcategorías
    const toggleCategory = (categoria: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoria)) {
                newSet.delete(categoria);
            } else {
                newSet.add(categoria);
            }
            return newSet;
        });
    };

    // Datos para el gráfico ordenados por duración promedio desc (solo consideramos padres)
    const chartData = useMemo(() => {
        if (!data) return [];
        return [...data]
            .sort((a, b) => b.duracion_promedio - a.duracion_promedio)
            .map(c => ({ ...c, displayCat: truncate(c.categoria) }));
    }, [data]);

    if (isError) {
        return (
            <div className="p-8 flex-1 flex flex-col items-center justify-center">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar categorías"
                    description="No se pudieron cargar los datos de análisis por categoría. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Análisis por Categoría"
                subtitle="Desglose de rendimiento por módulo y sus procesos específicos."
                icon={<Icon name="category" className="text-2xl" />}
            >
                <FiltroFecha value={dateRange} onChange={setDateRange} />
            </ReportHeader>

            {/* ── Contenido ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 px-6 pt-2 pb-16 lg:px-8">

                {/* Tabla de Categorías (Master/Detail) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><LoadingSkeleton rows={8} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3.5 px-4 w-10"></th>
                                        <th className="py-3.5 px-4">Categoría / Proceso</th>
                                        <th className="py-3.5 px-4 text-right">Total Tickets</th>
                                        <th className="py-3.5 px-4 text-right">Total Pasos</th>
                                        <th className="py-3.5 px-4 text-right" title="Mayor valor = flujo más complejo">Pasos por Ticket</th>
                                        <th className="py-3.5 px-4 text-right">Duración Promedio</th>
                                        <th className="py-3.5 px-4 text-right">Duración Máxima</th>
                                        <th className="py-3.5 px-4 text-right">% Cumplimiento SLA</th>
                                        <th className="py-3.5 px-4 text-right">Errores Graves</th>
                                        <th className="py-3.5 px-4 text-right">% Tickets con Novedad</th>
                                        <th className="py-3.5 px-4 text-center">Clasificación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(!data || data.length === 0) ? (
                                        <tr>
                                            <td colSpan={11} className="py-10 text-center text-gray-500">
                                                No hay datos de categorías disponibles en el rango de fechas.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((cat: CategoriaStats) => {
                                            const isExpanded = expandedCategories.has(cat.categoria);
                                            const hasSubcategories = cat.subcategorias && cat.subcategorias.length > 0;

                                            // Evaluaciones semánticas para la Categoría Padre
                                            const colorErrGravesPadre = getColorErroresGraves(cat.pct_errores_graves);

                                            return (
                                                <React.Fragment key={cat.categoria}>
                                                    {/* FILA PADRE (Categoría) */}
                                                    <tr
                                                        onClick={() => {
                                                            if (hasSubcategories) toggleCategory(cat.categoria);
                                                            handleVerTickets('categoria', cat.categoria);
                                                        }}
                                                        className={`transition-colors cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50/70 border-b-0' : 'bg-white'}`}
                                                    >
                                                        <td className="py-3.5 px-4 text-center text-slate-400">
                                                            {hasSubcategories && (
                                                                <Icon
                                                                    name={isExpanded ? 'keyboard_arrow_down' : 'chevron_right'}
                                                                    className="text-lg transition-transform"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 font-bold text-slate-800 max-w-[200px]">
                                                            <span title={cat.categoria}>{truncate(cat.categoria, 35)}</span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                                                            {formatNumero(cat.total_tickets)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-600">
                                                            {formatNumero(cat.total_pasos)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-600 font-medium tracking-tight">
                                                            {cat.pasos_por_ticket.toFixed(1)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                                                            {formatHoras(cat.duracion_promedio)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-600">
                                                            {formatHoras(cat.duracion_maxima)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">
                                                            {formatPct(cat.pct_cumplimiento)}
                                                        </td>
                                                        <td className={`py-3.5 px-4 text-right font-medium ${colorErrGravesPadre === 'rojo' ? 'text-red-700 bg-red-50/50' :
                                                            colorErrGravesPadre === 'amarillo' ? 'text-yellow-700 bg-yellow-50/50' :
                                                                'text-emerald-700 bg-emerald-50/50'
                                                            }`}>
                                                            {cat.pct_errores_graves > 0 ? formatPct(cat.pct_errores_graves) : '—'}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-slate-600">
                                                            {formatPct(cat.pct_con_novedad)}
                                                        </td>
                                                        <td className="py-3.5 px-4 bg-slate-50/30">
                                                            <div className="flex justify-center">
                                                                <ClasificacionDot clasificacion={cat.clasificacion} />
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* FILAS HIJO (Subcategorías) */}
                                                    {isExpanded && hasSubcategories && cat.subcategorias.map((sub: SubcategoriaStats, idx: number) => {
                                                        const colorErrGraves = getColorErroresGraves(sub.pct_errores_graves);
                                                        const isSubSelected = subcategoriaExpandedTickets === sub.subcategoria;
                                                        const isLoadingSubTickets = isSubSelected && loadingSubcategoriaTickets;
                                                        const subTicketsData = isSubSelected ? subcategoriaTicketsData : null;

                                                        return (
                                                            <React.Fragment key={`${cat.categoria}-${sub.subcategoria}`}>
                                                                <tr
                                                                    onClick={() => {
                                                                        if (subcategoriaExpandedTickets === sub.subcategoria) {
                                                                            setSubcategoriaExpandedTickets(null);
                                                                        } else {
                                                                            setSubcategoriaExpandedTickets(sub.subcategoria);
                                                                            setSubcategoriaPage(1);
                                                                            setSelectedItemForTickets(null);
                                                                            setCategoriaPage(1);
                                                                        }
                                                                    }}
                                                                    className={`bg-[#FAFAFA] hover:bg-slate-50 cursor-pointer transition-colors ${isSubSelected ? 'bg-blue-50' : ''} ${idx === cat.subcategorias.length - 1 ? 'border-b border-slate-200' : 'border-b border-dashed border-slate-200/60'}`}
                                                                >
                                                                    <td className="py-2.5 px-4"></td>
                                                                    <td className="py-2.5 px-4 font-medium text-slate-600 flex items-center gap-2">
                                                                        <span className="text-slate-300 font-mono">└</span>
                                                                        <span title={sub.subcategoria}>{truncate(sub.subcategoria, 32)}</span>
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-600">
                                                                        {formatNumero(sub.total_tickets)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-500">
                                                                        {formatNumero(sub.total_pasos)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-500 tracking-tight">
                                                                        {sub.pasos_por_ticket.toFixed(1)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-600">
                                                                        {formatHoras(sub.duracion_promedio)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-500">
                                                                        {formatHoras(sub.duracion_maxima)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-600">
                                                                        {formatPct(sub.pct_cumplimiento)}
                                                                    </td>
                                                                    <td className={`py-2.5 px-4 text-right font-medium ${colorErrGraves === 'rojo' ? 'text-red-700 bg-red-50/50' :
                                                                        colorErrGraves === 'amarillo' ? 'text-yellow-700 bg-yellow-50/50' :
                                                                            'text-emerald-700 bg-emerald-50/50'
                                                                        }`}>
                                                                        {sub.pct_errores_graves > 0 ? formatPct(sub.pct_errores_graves) : '—'}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-right text-slate-500">
                                                                        {formatPct(sub.pct_con_novedad)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4">
                                                                        <div className="flex justify-center scale-90">
                                                                            <ClasificacionDot clasificacion={sub.clasificacion} />
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* Tickets de la subcategoría - inline expandable */}
                                                                {isSubSelected && (
                                                                    <tr key={`${cat.categoria}-${sub.subcategoria}-tickets`}>
                                                                        <td colSpan={11} className="p-0">
                                                                            <div className="px-4 py-3 bg-gray-50 border-t border-dashed border-slate-200">
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <Icon name="confirmation_number" className="text-brand-teal text-sm" />
                                                                                    <span className="text-xs font-semibold text-gray-600">
                                                                                        Tickets de "{sub.subcategoria}"
                                                                                    </span>
                                                                                </div>
                                                                                {isLoadingSubTickets ? (
                                                                                    <LoadingSkeleton rows={3} />
                                                                                ) : subTicketsData?.data && subTicketsData.data.length > 0 ? (
                                                                                    <>
                                                                                        <TicketTable tickets={subTicketsData.data} emptyMessage="No hay tickets para esta subcategoría." />
                                                                                        {subTicketsData.totalPages > 1 && (
                                                                                            <div className="mt-3">
                                                                                                <Pagination
                                                                                                    page={subcategoriaPage}
                                                                                                    totalPages={subTicketsData.totalPages}
                                                                                                    onPageChange={setSubcategoriaPage}
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <EmptyState icon="confirmation_number" title="Sin tickets" description="No hay tickets para esta subcategoría." />
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Tickets de la Categoría (no subcategoría) ─────────────────── */}
                {selectedItemForTickets && selectedItemForTickets.type === 'categoria' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-teal-50 rounded-lg text-brand-teal">
                                    <Icon name="confirmation_number" className="text-[1.1rem]" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Tickets de Categoría: {selectedItemForTickets.name}
                                </h3>
                                {loadingCategoriaTickets && <span className="text-sm text-gray-400">(Cargando...)</span>}
                            </div>
                            <button
                                onClick={() => setSelectedItemForTickets(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Icon name="close" className="text-lg" />
                            </button>
                        </div>

                        {loadingCategoriaTickets ? (
                            <div className="p-6"><LoadingSkeleton rows={5} /></div>
                        ) : categoriaTicketsData?.data && categoriaTicketsData.data.length > 0 ? (
                            <>
                                <TicketTable tickets={categoriaTicketsData.data} emptyMessage="No hay tickets para esta categoría." />
                                {categoriaTicketsData.totalPages > 1 && (
                                    <Pagination page={categoriaPage} totalPages={categoriaTicketsData.totalPages} onPageChange={setCategoriaPage} />
                                )}
                            </>
                        ) : (
                            <EmptyState icon="confirmation_number" title="Sin tickets" description="No hay tickets para esta categoría en el período seleccionado." />
                        )}
                    </div>
                )}

                {/* BarChart horizontal: duración promedio por categoría principal */}
                {!isLoading && chartData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                            <Icon name="bar_chart" className="text-gray-400 text-xl" />
                            Duración Promedio por Categoría Principal
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Ordenado de mayor a menor duración. Colocar el cursor para ver detalles de pasos y novedad.
                        </p>
                        <div style={{ height: Math.max(300, chartData.length * 36) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={chartData}
                                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => `${Math.round(v)}h`}
                                        stroke="#cbd5e1"
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="displayCat"
                                        width={180}
                                        tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                                        stroke="#cbd5e1"
                                    />
                                    <Tooltip content={<CategoriaTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="duracion_promedio" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={getHexClasificacion(entry.clasificacion)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
