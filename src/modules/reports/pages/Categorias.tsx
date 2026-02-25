import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { useCategorias } from '../hooks/useDashboard';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatPct } from '../utils/formatters';
import { getHexClasificacion, getClasificacionErrores } from '../utils/colores';
import { IconCategory } from '@tabler/icons-react';

/** Tooltip personalizado para el BarChart de categorías */
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
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm text-sm">
                <p className="font-bold text-gray-800 mb-1 max-w-[180px]">{d.categoria}</p>
                <p className="text-gray-600">
                    Pasos/Ticket:{' '}
                    <span className="font-semibold text-gray-900">{Number(d.pasos_por_ticket).toFixed(1)}</span>
                </p>
                <p className="text-gray-600">
                    % Con novedad:{' '}
                    <span className="font-semibold text-gray-900">{Number(d.pct_con_novedad).toFixed(1)}%</span>
                </p>
            </div>
        );
    }
    return null;
};

/** Trunca texto largo en el eje Y del gráfico */
const truncate = (str: string, max = 28) =>
    str.length > max ? str.slice(0, max) + '…' : str;

export default function Categorias() {
    const { data, isLoading, isError, refetch } = useCategorias();

    // Datos para el gráfico ordenados por duración promedio desc
    const chartData = useMemo(() => {
        if (!data) return [];
        return [...data]
            .sort((a, b) => Number(b.duracion_promedio) - Number(a.duracion_promedio))
            .map(c => ({ ...c, displayCat: truncate(c.categoria) }));
    }, [data]);

    if (isError) {
        return (
            <div className="p-8">
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
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <IconCategory size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Análisis por Categoría</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Duración, complejidad y novedades por categoría de ticket.
                    </p>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {isLoading ? (
                    <div className="p-6"><LoadingSkeleton rows={8} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4">Categoría</th>
                                    <th className="py-3 px-4 text-right">Tickets</th>
                                    <th className="py-3 px-4 text-right">Total Pasos</th>
                                    <th className="py-3 px-4 text-right" title="Mayor valor = flujo más complejo">
                                        Pasos/Ticket ℹ
                                    </th>
                                    <th className="py-3 px-4 text-right">Dur. Prom</th>
                                    <th className="py-3 px-4 text-right">Dur. Máx</th>
                                    <th className="py-3 px-4 text-right">% Cumplim.</th>
                                    <th className="py-3 px-4 text-right">% Con Novedad</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(!data || data.length === 0) ? (
                                    <tr>
                                        <td colSpan={9} className="py-10 text-center text-gray-500">
                                            No hay datos de categorías disponibles.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((cat, idx) => {
                                        const claError = getClasificacionErrores(Number(cat.pct_con_novedad));
                                        const colorNovedades = {
                                            verde: 'text-green-700',
                                            amarillo: 'text-yellow-700',
                                            rojo: 'text-red-700',
                                        }[claError];

                                        return (
                                            <tr
                                                key={cat.categoria}
                                                className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                            >
                                                <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px]">
                                                    <span title={cat.categoria}>{truncate(cat.categoria, 35)}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-700">
                                                    {Number(cat.total_tickets).toLocaleString('es-CO')}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-700">
                                                    {Number(cat.total_pasos).toLocaleString('es-CO')}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-700 font-medium">
                                                    {Number(cat.pasos_por_ticket).toFixed(1)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-700">
                                                    {formatHoras(Number(cat.duracion_promedio))}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-700">
                                                    {formatHoras(Number(cat.duracion_maxima))}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-700">
                                                    {formatPct(Number(cat.pct_cumplimiento))}
                                                </td>
                                                <td className={`py-3 px-4 text-right font-semibold ${colorNovedades}`}>
                                                    {formatPct(Number(cat.pct_con_novedad))}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center">
                                                        <ClasificacionDot clasificacion={cat.clasificacion} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* BarChart horizontal: duración promedio por categoría */}
            {!isLoading && chartData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                        Duración Promedio por Categoría
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                        Ordenado de mayor a menor duración. Colores según clasificación de la categoría.
                    </p>
                    <div style={{ height: Math.max(300, chartData.length * 36) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickFormatter={(v) => `${Math.round(v)}h`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="displayCat"
                                    width={210}
                                    tick={{ fontSize: 11, fill: '#374151' }}
                                />
                                <Tooltip content={<CategoriaTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="duracion_promedio" radius={[0, 4, 4, 0]} maxBarSize={20}>
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
    );
}
