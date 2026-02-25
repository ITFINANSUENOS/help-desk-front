import { useState } from 'react';
import { useCuellos } from '../hooks/useDashboard';
import { BarChartCuellos } from '../components/charts/BarChartCuellos';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatPct } from '../utils/formatters';
import { IconBottle } from '@tabler/icons-react';

const LIMIT_OPTIONS = [10, 20, 30, 50] as const;

/** Badge de severidad coloreado */
const SeveridadBadge = ({ severidad }: { severidad: 'critico' | 'moderado' | 'normal' }) => {
    const styles = {
        critico: 'bg-red-100 text-red-700 border border-red-200',
        moderado: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        normal: 'bg-green-100 text-green-700 border border-green-200',
    } as const;

    const labels = {
        critico: 'CRÍTICO',
        moderado: 'MODERADO',
        normal: 'NORMAL',
    } as const;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${styles[severidad]}`}>
            {labels[severidad]}
        </span>
    );
};

export default function CuellosBottleneck() {
    const [limit, setLimit] = useState<typeof LIMIT_OPTIONS[number]>(20);
    const { data, isLoading, isError, refetch } = useCuellos(limit);

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
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg text-red-500">
                        <IconBottle size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Cuellos de Botella</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Pasos del flujo con mayor duración promedio y tasa de atrasos.
                        </p>
                    </div>
                </div>

                {/* Selector de cantidad */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Mostrar top</span>
                    <select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value) as typeof LIMIT_OPTIONS[number])}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#43BBCA] bg-white"
                    >
                        {LIMIT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row: 2 columnas */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LoadingSkeleton className="h-[420px]" />
                    <LoadingSkeleton className="h-[420px]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    {/* Columna izquierda — Gráfico (55%) */}
                    <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

                    {/* Columna derecha — Tabla (45%) */}
                    <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-3">Paso</th>
                                        <th className="py-3 px-3 text-right">Ocurr.</th>
                                        <th className="py-3 px-3 text-right">Dur. Prom</th>
                                        <th className="py-3 px-3 text-right">% Atrasos</th>
                                        <th className="py-3 px-3 text-center">Severidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
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
                                                    className="py-2.5 px-3 font-medium text-gray-800 max-w-[160px]"
                                                    title={item.paso_flujo}
                                                >
                                                    <span className="block truncate">{item.paso_flujo}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-gray-600">
                                                    {Number(item.total_ocurrencias).toLocaleString('es-CO')}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-gray-700 font-medium">
                                                    {formatHoras(Number(item.duracion_promedio))}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-gray-600">
                                                    {formatPct(Number(item.pct_atrasos))}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
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
    );
}
