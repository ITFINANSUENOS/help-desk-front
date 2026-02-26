import { useState, useEffect } from 'react';
import { useCuellos } from '../hooks/useDashboard';
import { BarChartCuellos } from '../components/charts/BarChartCuellos';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { formatHoras, formatPct } from '../utils/formatters';

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
    const { data, isLoading, isError, refetch } = useCuellos(limit);
    const { setTitle } = useLayout();

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

    // Ordenar por duración promedio desc para la tabla
    const sortedData = data
        ? [...data].sort((a, b) => Number(b.duracion_promedio) - Number(a.duracion_promedio))
        : [];

    return (
        <div className="flex h-full flex-col bg-gray-50/50">
            {/* Sticky Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 lg:px-8 border-b border-gray-100 bg-white/60 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center p-3 bg-red-50 rounded-xl text-red-600 shadow-sm border border-red-100">
                        <Icon name="hourglass_empty" className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Cuellos de Botella</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Pasos del flujo con mayor duración promedio y tasa de atrasos.
                        </p>
                    </div>
                </div>

                {/* Selector de cantidad */}
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
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto">

                {/* Row: 2 columnas */}
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LoadingSkeleton className="h-[420px]" />
                        <LoadingSkeleton className="h-[420px]" />
                    </div>
                ) : (
                    <div className="mb-6">
                        {/* Sección Superior — Gráfico */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                Duración Promedio por Paso (horas)
                            </h3>
                            {sortedData.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                                    Sin datos para mostrar.
                                </div>
                            ) : (
                                <BarChartCuellos data={sortedData} />
                            )}
                        </div>

                        {/* Sección Inferior — Tabla */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto flex-1">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider backdrop-blur-sm bg-opacity-95">
                                            <th scope="col" className="py-3.5 px-4 rounded-tl-lg">Paso</th>
                                            <th scope="col" className="py-3.5 px-4 text-right">Ocurr.</th>
                                            <th scope="col" className="py-3.5 px-4 text-right">Dur. Prom</th>
                                            <th scope="col" className="py-3.5 px-4 text-right">% Atrasos</th>
                                            <th scope="col" className="py-3.5 px-4 text-center rounded-tr-lg">Severidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sortedData.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                                                    Sin datos
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedData.map((item, idx) => (
                                                <tr
                                                    key={`${item.paso_flujo}-${idx}`}
                                                    className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                                >
                                                    <td
                                                        className="py-3 px-4 font-medium text-gray-800 max-w-[160px]"
                                                        title={item.paso_flujo}
                                                    >
                                                        <span className="block truncate">{item.paso_flujo}</span>
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
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leyenda de severidad */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Criterios de severidad</p>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-gray-700">
                                <span className="font-semibold text-red-700">Crítico:</span> duración promedio ≥ 100 hrs
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
                            <span className="text-gray-700">
                                <span className="font-semibold text-yellow-700">Moderado:</span> duración promedio ≥ 50 hrs
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-gray-700">
                                <span className="font-semibold text-green-700">Normal:</span> duración promedio &lt; 50 hrs
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
