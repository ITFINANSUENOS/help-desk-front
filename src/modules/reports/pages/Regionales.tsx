import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { useRegionales } from '../hooks/useDashboard';
import { KPICard } from '../components/ui/KPICard';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatNumero, formatPct } from '../utils/formatters';
import { getHexClasificacion } from '../utils/colores';
import { IconMap, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

/** Tooltip personalizado para el BarChart de regionales */
const RegionalTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: { regional: string; pct_cumplimiento: number; total_tickets: number } }>;
}) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm text-sm">
                <p className="font-bold text-gray-800 mb-1">{d.regional}</p>
                <p className="text-gray-600">
                    % Cumplimiento: <span className="font-semibold text-gray-900">{Number(d.pct_cumplimiento).toFixed(1)}%</span>
                </p>
                <p className="text-gray-600">
                    Tickets: <span className="font-semibold text-gray-900">{Number(d.total_tickets)}</span>
                </p>
            </div>
        );
    }
    return null;
};

/** Fondo de fila según clasificación */
const rowBg: Record<'verde' | 'amarillo' | 'rojo', string> = {
    verde: 'bg-green-50',
    amarillo: 'bg-yellow-50',
    rojo: 'bg-red-50',
};

export default function Regionales() {
    const { data, isLoading, isError, refetch } = useRegionales();

    // KPIs derivados
    const { mejor, peor, totalActivas } = useMemo(() => {
        if (!data || data.length === 0) return { mejor: null, peor: null, totalActivas: 0 };
        const sorted = [...data].sort((a, b) => b.pct_cumplimiento - a.pct_cumplimiento);
        return {
            mejor: sorted[0],
            peor: sorted[sorted.length - 1],
            totalActivas: data.length,
        };
    }, [data]);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar regionales"
                    description="No se pudieron cargar los datos por regional. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-[#2B378A]">
                    <IconMap size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Análisis por Regional</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Comparativa de desempeño entre regionales activas.</p>
                </div>
            </div>

            {/* Row 1: 3 KPI Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[0, 1, 2].map(i => <LoadingSkeleton key={i} className="h-28" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <KPICard
                        titulo="Regionales Activas"
                        valor={formatNumero(totalActivas)}
                        icono={IconMap}
                    />
                    <KPICard
                        titulo="Mejor % Cumplimiento SLA"
                        valor={mejor ? `${mejor.regional} — ${formatPct(mejor.pct_cumplimiento)}` : '—'}
                        icono={IconTrendingUp}
                        clasificacion="verde"
                    />
                    <KPICard
                        titulo="Peor % Cumplimiento SLA"
                        valor={peor ? `${peor.regional} — ${formatPct(peor.pct_cumplimiento)}` : '—'}
                        icono={IconTrendingDown}
                        clasificacion={peor?.clasificacion}
                    />
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {isLoading ? (
                    <div className="p-6"><LoadingSkeleton rows={6} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4">Regional</th>
                                    <th className="py-3 px-4 text-right">Usuarios</th>
                                    <th className="py-3 px-4 text-right">Tickets</th>
                                    <th className="py-3 px-4 text-right">A Tiempo</th>
                                    <th className="py-3 px-4 text-right">Atrasados</th>
                                    <th className="py-3 px-4 text-right">% Cumplim.</th>
                                    <th className="py-3 px-4 text-right">% Error</th>
                                    <th className="py-3 px-4 text-right">T. Prom</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(!data || data.length === 0) ? (
                                    <tr>
                                        <td colSpan={9} className="py-10 text-center text-gray-500 text-sm">
                                            No hay datos de regionales disponibles.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map(reg => (
                                        <tr
                                            key={reg.regional}
                                            className={`${rowBg[reg.clasificacion]} transition-colors hover:brightness-95`}
                                        >
                                            <td className="py-3 px-4 font-semibold text-gray-900 text-sm">{reg.regional}</td>
                                            <td className="py-3 px-4 text-right text-sm text-gray-700">{formatNumero(reg.usuarios)}</td>
                                            <td className="py-3 px-4 text-right text-sm text-gray-700">{formatNumero(reg.total_tickets)}</td>
                                            <td className="py-3 px-4 text-right text-sm text-green-700 font-medium">{formatNumero(reg.a_tiempo)}</td>
                                            <td className="py-3 px-4 text-right text-sm text-red-700 font-medium">{formatNumero(reg.atrasados)}</td>
                                            <td className="py-3 px-4 text-right text-sm text-gray-700">{formatPct(reg.pct_cumplimiento)}</td>
                                            <td className="py-3 px-4 text-right text-sm text-gray-700">{formatPct(reg.pct_error_proceso)}</td>
                                            <td className="py-3 px-4 text-right text-sm text-gray-700">{formatHoras(reg.tiempo_promedio)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-center">
                                                    <ClasificacionDot clasificacion={reg.clasificacion} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* BarChart regionales vs % cumplimiento */}
            {!isLoading && data && data.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">
                        % Cumplimiento SLA por Regional
                    </h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                            >
                                <XAxis
                                    dataKey="regional"
                                    tick={{ fontSize: 11, fill: '#4b5563' }}
                                    angle={-30}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    unit="%"
                                />
                                <Tooltip content={<RegionalTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                <ReferenceLine
                                    y={85}
                                    stroke="#2B378A"
                                    strokeDasharray="4 3"
                                    label={{ value: 'Meta 85%', position: 'insideTopRight', fontSize: 11, fill: '#2B378A' }}
                                />
                                <Bar dataKey="pct_cumplimiento" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={getHexClasificacion(entry.clasificacion)}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 flex items-center gap-6 justify-center text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm inline-block bg-green-500" />
                            Verde ≥ 90%
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm inline-block bg-yellow-400" />
                            Amarillo ≥ 75%
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm inline-block bg-red-500" />
                            Rojo &lt; 75%
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-6 border-t-2 border-dashed border-[#2B378A] inline-block" />
                            Meta 85%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
