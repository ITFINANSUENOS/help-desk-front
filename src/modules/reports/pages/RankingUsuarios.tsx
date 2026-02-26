import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRanking } from '../hooks/useDashboard';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { FiltroRegional } from '../components/ui/FiltroRegional';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatNumero, formatPct } from '../utils/formatters';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { useExport } from '../hooks/useExport';
import { useEffect } from 'react';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export default function RankingUsuarios() {
    const navigate = useNavigate();
    const [selectedRegional, setSelectedRegional] = useState<string | undefined>();
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(50);
    const [page, setPage] = useState(1);
    const { exportar, loading: exportLoading } = useExport();
    const { setTitle } = useLayout();

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    const { data: rankingData, isLoading, isError, refetch } = useRanking(limit, page);

    // Lista única de regionales extraida de los propios datos del ranking
    const listRegionales = useMemo(() => {
        if (!rankingData?.data) return [];
        return Array.from(new Set(rankingData.data.map(u => u.regional))).sort();
    }, [rankingData]);

    // Filtro client-side: por regional y por nombre
    const filteredData = useMemo(() => {
        if (!rankingData?.data) return [];
        return rankingData.data.filter(row => {
            const matchesRegional = !selectedRegional || row.regional === selectedRegional;
            const matchesSearch = !search || row.usuario_nombre.toLowerCase().includes(search.toLowerCase());
            return matchesRegional && matchesSearch;
        });
    }, [rankingData, selectedRegional, search]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }, []);

    const handleLimitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    }, []);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar el ranking"
                    description="No se pudieron cargar los datos del ranking. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-gray-50/50">
            {/* Sticky Header */}
            <div className="flex flex-col gap-4 px-6 py-5 lg:px-8 border-b border-gray-100 bg-white/60 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm border border-blue-100">
                            <Icon name="emoji_events" className="text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">Ranking de Usuarios</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Desempeño individual por tickets gestionados y cumplimiento SLA.</p>
                        </div>
                    </div>

                    {/* Botón exportar (Desktop) */}
                    <div className="hidden sm:block">
                        <button
                            onClick={() => exportar('xlsx', 'ranking')}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#2B378A] text-white rounded-lg hover:bg-[#23468C] transition-colors disabled:opacity-50"
                        >
                            <Icon name="download" className="text-[1.1rem]" />
                            {exportLoading ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                    </div>
                </div>

                {/* Filtros Container */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Filtro regional */}
                        <div className="w-full sm:w-56">
                            <FiltroRegional
                                value={selectedRegional}
                                onChange={setSelectedRegional}
                                regionales={listRegionales}
                                placeholder="Todas las regionales"
                            />
                        </div>

                        {/* Búsqueda por nombre */}
                        <div className="relative w-full sm:w-64">
                            <Icon
                                name="search"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar por nombre..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43BBCA] focus:border-transparent bg-white shadow-sm"
                            />
                        </div>

                        {/* Filas por página */}
                        <select
                            value={limit}
                            onChange={handleLimitChange}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43BBCA] bg-white shadow-sm"
                        >
                            {PAGE_SIZE_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt} filas</option>
                            ))}
                        </select>
                    </div>

                    {/* Botón exportar (Mobile) */}
                    <button
                        onClick={() => exportar('xlsx', 'ranking')}
                        disabled={exportLoading}
                        className="sm:hidden w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium bg-[#2B378A] text-white rounded-lg hover:bg-[#23468C] transition-colors disabled:opacity-50"
                    >
                        <Icon name="download" className="text-[1.1rem]" />
                        {exportLoading ? 'Exportando...' : 'Exportar Excel'}
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto overflow-y-auto">

                {/* ── Info banner for score system ───────────────────────────── */}
                <div className="mb-5 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 shadow-sm">
                    <Icon name="info" className="text-blue-500 mt-0.5 text-[1.1rem]" />
                    <p>
                        <strong>¿Cómo funciona el Ranking?</strong> Premia a quien hace muchas cosas bien y penaliza fuerte a quien comete errores, sin importar cuántos tickets tenga. <br /><span className="opacity-80">Un usuario con 10 tickets perfectos es bueno, pero uno con 100 tickets casi perfectos es mejor. Y uno con muchos tickets pero lleno de errores cae al fondo sin importar su volumen.</span>
                    </p>
                </div>

                {/* Tabla */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6">
                            <LoadingSkeleton rows={8} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4 text-center">#</th>
                                        <th className="py-3 px-4">Usuario</th>
                                        <th className="py-3 px-4">Regional</th>
                                        <th className="py-3 px-4">Rol</th>
                                        <th className="py-3 px-4 text-right">Tickets</th>
                                        <th className="py-3 px-4 text-right">% SLA</th>
                                        <th className="py-3 px-4 text-right">% Error</th>
                                        <th className="py-3 px-4 text-right">T. Prom</th>
                                        <th className="py-3 px-4 text-center">Score</th>
                                        <th className="py-3 px-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-gray-500 text-sm">
                                                No hay usuarios que coincidan con los filtros aplicados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((row, idx) => (
                                            <tr
                                                key={row.usuario_id}
                                                onClick={() => navigate(`/reports/dashboard/usuario/${row.usuario_id}`)}
                                                className={`cursor-pointer hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                            >
                                                {/* Posición */}
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-sm font-bold text-gray-600">
                                                        #{row.ranking}
                                                    </span>
                                                </td>
                                                {/* Nombre */}
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {row.usuario_nombre}
                                                    </span>
                                                    {row.cargo && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{row.cargo}</p>
                                                    )}
                                                </td>
                                                {/* Regional */}
                                                <td className="py-3 px-4 text-sm text-gray-600">{row.regional}</td>
                                                {/* Rol */}
                                                <td className="py-3 px-4 text-sm text-gray-600">{row.rol}</td>
                                                {/* Tickets */}
                                                <td className="py-3 px-4 text-sm text-right font-medium text-gray-700">
                                                    {formatNumero(row.tickets_gestionados)}
                                                </td>
                                                {/* % SLA */}
                                                <td className="py-3 px-4 text-sm text-right text-gray-700">
                                                    {formatPct(row.pct_cumplimiento_sla)}
                                                </td>
                                                {/* % Error */}
                                                <td className="py-3 px-4 text-sm text-right text-gray-700">
                                                    {formatPct(row.pct_error_proceso)}
                                                </td>
                                                {/* Tiempo promedio */}
                                                <td className="py-3 px-4 text-sm text-right text-gray-700">
                                                    {formatHoras(row.tiempo_promedio)}
                                                </td>
                                                {/* Score */}
                                                <td className="py-3 px-4 text-center">
                                                    <ScoreBadge score={row.score_total} />
                                                </td>
                                                {/* Estado */}
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center">
                                                        <ClasificacionDot clasificacion={row.clasificacion} />
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

                {/* Footer: conteo */}
                {!isLoading && rankingData && (
                    <div className="mt-3 text-xs text-gray-500 text-right">
                        Mostrando <span className="font-semibold">{filteredData.length}</span> usuarios
                        {(selectedRegional || search) && (
                            <> (filtrado de <span className="font-semibold">{rankingData.data.length}</span>)</>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
