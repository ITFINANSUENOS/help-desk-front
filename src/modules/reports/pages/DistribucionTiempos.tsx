import { useMemo } from 'react';
import { useDistribucion } from '../hooks/useDashboard';
import { KPICard } from '../components/ui/KPICard';
import { HistogramaTiempos } from '../components/charts/HistogramaTiempos';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatNumero, formatPct } from '../utils/formatters';
import { IconClockHour3, IconTrendingUp, IconAlertTriangle } from '@tabler/icons-react';

export default function DistribucionTiempos() {
    const { data, isLoading, isError, refetch } = useDistribucion();

    // KPIs derivados
    const { totalTickets, rangoMayorConcentracion, pctMas24Horas } = useMemo(() => {
        if (!data?.rangos || data.rangos.length === 0) {
            return { totalTickets: 0, rangoMayorConcentracion: null, pctMas24Horas: 0 };
        }

        const total = data.rangos.reduce((acc, curr) => acc + Number(curr.cantidad), 0);

        // Encontrar el rango con más tickets
        const rangoMayor = [...data.rangos].sort((a, b) => Number(b.cantidad) - Number(a.cantidad))[0];

        // Calcular porcentaje que excede las 24 horas (asumiendo que los últimos 2 rangos son 24-48h y >48h)
        const ticketsLentos = data.rangos
            .filter(r => r.rango_tiempo.includes('> 48h') || r.rango_tiempo.includes('24-48h'))
            .reduce((acc, curr) => acc + Number(curr.cantidad), 0);

        const pctLentos = total > 0 ? (ticketsLentos / total) * 100 : 0;

        return {
            totalTickets: total,
            rangoMayorConcentracion: rangoMayor,
            pctMas24Horas: pctLentos
        };
    }, [data]);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar distribución de tiempos"
                    description="No se pudieron cargar los datos. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <IconClockHour3 size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Distribución de Tiempos</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Análisis de frecuencia de resolución de tickets por rangos de duración.
                    </p>
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
                        titulo="Total Tickets Analizados"
                        valor={formatNumero(totalTickets)}
                        icono={IconClockHour3}
                    />
                    <KPICard
                        titulo="Rango Frecuente (Moda)"
                        valor={rangoMayorConcentracion ? rangoMayorConcentracion.rango_tiempo : '—'}
                        icono={IconTrendingUp}
                        clasificacion="verde"
                    />
                    <KPICard
                        titulo="Tickets > 24 hrs"
                        valor={formatPct(pctMas24Horas)}
                        icono={IconAlertTriangle}
                        clasificacion={pctMas24Horas > 15 ? 'rojo' : pctMas24Horas > 5 ? 'amarillo' : 'verde'}
                    />
                </div>
            )}

            {/* Fila principal: Gráfico en toda la anchura y tabla abajo, o divididos */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                {/* Gráfico 2/3 en desktop grande */}
                <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-6">
                        Histograma de Resolución
                    </h3>
                    {isLoading ? (
                        <LoadingSkeleton className="h-[400px]" />
                    ) : !data?.rangos || data.rangos.length === 0 ? (
                        <div className="flex justify-center items-center h-[400px] text-gray-400">
                            No hay datos para estructurar el histograma
                        </div>
                    ) : (
                        <HistogramaTiempos data={data.rangos} />
                    )}
                </div>

                {/* Tabla 1/3 en desktop grande */}
                <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 bg-[#FAFAFA]">
                        <h3 className="text-base font-semibold text-gray-800">
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
                                    <th className="py-3 px-4 text-right hidden sm:table-cell">% Acum.</th>
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
                                            <td className="py-3 px-4 font-medium text-gray-700">
                                                {row.rango_tiempo}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                                                {Number(row.cantidad).toLocaleString('es-CO')}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600">
                                                {formatPct(totalTickets > 0 ? (Number(row.cantidad) / totalTickets) * 100 : 0)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-indigo-600 font-medium hidden sm:table-cell">
                                                {formatPct(Number(row.pct_acumulado))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
