import { useState, useMemo } from 'react';
import { useKpis, useRegionales } from '../hooks/useDashboard';
import { KPICard } from '../components/ui/KPICard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { FiltroRegional } from '../components/ui/FiltroRegional';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { getClasificacionCumplimiento, getClasificacionErrores } from '../utils/colores';
import { formatHoras, formatNumero, formatPct, formatFecha } from '../utils/formatters';
import { IconTicket, IconTarget, IconUsers, IconAlertTriangle, IconClock, IconBuildingCommunity } from '@tabler/icons-react';

export default function MainDashboard() {
    // Hooks parameters: The API doesn't support regional filter for KPIs yet,
    // but we add the visual filter according to the specification.
    const [selectedRegional, setSelectedRegional] = useState<string | undefined>();

    // Fetch data
    const { data: kpis, isLoading: loadingKpis, isError: errorKpis, refetch: refetchKpis } = useKpis();
    const { data: regionalesData, isLoading: loadingRegionales, isError: errorRegionales, refetch: refetchRegionales } = useRegionales();

    // Derived states
    const isLoading = loadingKpis || loadingRegionales;
    const isError = errorKpis || errorRegionales;

    // Optional client-side filtering logic if you wanted it, but global kpis are fixed for now
    // We just trigger refetches
    const handleRegionalChange = (regional?: string) => {
        setSelectedRegional(regional);
        // If the APIs are ever updated to use this, refetch will run query functions with new keys or params.
        refetchKpis();
        refetchRegionales();
    };

    // Extract all unique regions for the filter
    const listRegionales = useMemo(() => {
        if (!regionalesData) return [];
        return Array.from(new Set(regionalesData.map(r => r.regional))).sort();
    }, [regionalesData]);

    // Top 5 Regionales
    const top5Regionales = useMemo(() => {
        if (!regionalesData) return [];
        // Already ordered descending by API, limit to 5
        let data = regionalesData;
        if (selectedRegional) {
            data = data.filter(r => r.regional === selectedRegional);
        }
        return data.slice(0, 5);
    }, [regionalesData, selectedRegional]);

    // Error state
    if (isError) {
        return (
            <div className="p-8 pb-10">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar KPIs"
                    description="No se pudieron cargar los datos del sistema global. Intenta nuevamente."
                    action={{
                        label: "Reintentar",
                        onClick: () => { refetchKpis(); refetchRegionales(); }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header: Title and Filter */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Principal</h2>
                    <p className="mt-1 text-sm text-gray-500">Métricas globales y estado general del sistema.</p>
                </div>
                <div className="w-full md:w-80">
                    <FiltroRegional
                        value={selectedRegional}
                        onChange={handleRegionalChange}
                        regionales={listRegionales}
                        placeholder="Todas las regionales"
                    />
                </div>
            </div>

            {/* Loading state rendering full skeleton layout */}
            {isLoading && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-28" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7">
                            <LoadingSkeleton className="h-80" />
                        </div>
                        <div className="lg:col-span-5">
                            <LoadingSkeleton className="h-80" />
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && kpis && (
                <div className="space-y-6">
                    {/* Row 1: 5 KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <KPICard
                            titulo="Total Tickets Gestionados"
                            valor={formatNumero(kpis.total_tickets)}
                            icono={IconTicket}
                        />
                        <KPICard
                            titulo="% Cumplimiento SLA"
                            valor={formatPct(kpis.pct_cumplimiento)}
                            icono={IconTarget}
                            clasificacion={getClasificacionCumplimiento(kpis.pct_cumplimiento)}
                        />
                        <KPICard
                            titulo="Usuarios Activos"
                            valor={formatNumero(kpis.usuarios_activos)}
                            icono={IconUsers}
                        />
                        <KPICard
                            titulo="Errores de Proceso"
                            valor={formatPct(kpis.pct_error_proceso)}
                            icono={IconAlertTriangle}
                            clasificacion={getClasificacionErrores(kpis.pct_error_proceso)}
                        />
                        <KPICard
                            titulo="Tiempo Promedio Global"
                            valor={formatHoras(kpis.tiempo_promedio_hrs)}
                            icono={IconClock}
                        />
                    </div>

                    {/* Row 2: 2 Columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Columna Izquierda (60%): Resumen por Regional */}
                        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <IconBuildingCommunity size={20} className="text-gray-500" />
                                Resumen por Regional (Top 5)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Regional</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Tickets</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">% Cumplimiento</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Tiempo Prom</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {top5Regionales.length > 0 ? top5Regionales.map(reg => (
                                            <tr key={reg.regional} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-gray-900">{reg.regional}</td>
                                                <td className="py-3 px-4 text-right text-gray-600">{formatNumero(reg.total_tickets)}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span>{formatPct(reg.pct_cumplimiento)}</span>
                                                        <ClasificacionDot clasificacion={reg.clasificacion} />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-600 font-medium">{formatHoras(reg.tiempo_promedio)}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center text-gray-500">No hay información de regionales</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Columna Derecha (40%): Estado General */}
                        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">Estado General</h3>

                            <div className="flex-1 space-y-6">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-sm text-gray-500">Top Regional</span>
                                    <span className="font-semibold text-gray-900">{kpis.top_regional || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-sm text-gray-500">Total Regionales activas</span>
                                    <span className="font-semibold text-gray-900">{formatNumero(kpis.regionales_activos)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-sm text-gray-500">Tickets únicos</span>
                                    <span className="font-semibold text-gray-900">{formatNumero(kpis.tickets_unicos)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-sm text-gray-500">Tiempo total invertido</span>
                                    <span className="font-semibold text-brand-teal">{formatHoras(kpis.tiempo_total_hrs)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm text-gray-500">Última actualización</span>
                                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                        {formatFecha(kpis.ultima_actualizacion)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
