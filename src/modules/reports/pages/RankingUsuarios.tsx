import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRanking } from '../hooks/useDashboard';
import { ReportTable, Column } from '../components/ui/ReportTable';
import { FiltroRegional } from '../components/ui/FiltroRegional';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { FiltroFilas } from '../components/ui/FiltroFilas';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatNumero, formatPct } from '../utils/formatters';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { useExport } from '../hooks/useExport';
import { useEffect } from 'react';
import { ReportHeader } from '../components/ui/ReportHeader';

export default function RankingUsuarios() {
    const navigate = useNavigate();
    const [selectedRegional, setSelectedRegional] = useState<string | undefined>();
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(50);
    const [page, setPage] = useState(1);
    const { dateRange, setDateRange } = useDateFilter();
    const { exportar, loading: exportLoading } = useExport();
    const { setTitle } = useLayout();

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    const { data: rankingData, isLoading, isError, refetch } = useRanking(limit, page, dateRange);

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

    // Columnas para ReportTable
    const columns: Column<typeof filteredData[0]>[] = [
        {
            header: '#',
            accessor: 'ranking',
            align: 'center',
            render: (value) => <span className="text-sm font-bold text-gray-600">#{value}</span>,
        },
        {
            header: 'Usuario',
            accessor: 'usuario_nombre',
            render: (value, row) => (
                <>
                    <span className="text-sm font-semibold text-gray-900">{String(value)}</span>
                    {row.cargo && <p className="text-xs text-gray-400 mt-0.5">{String(row.cargo)}</p>}
                </>
            ),
        },
        { header: 'Regional', accessor: 'regional' },
        { header: 'Rol', accessor: 'rol' },
        {
            header: 'Tickets',
            accessor: 'tickets_gestionados',
            align: 'right',
            render: (value) => <span className="font-medium text-gray-700">{formatNumero(Number(value))}</span>,
        },
        {
            header: '% SLA',
            accessor: 'pct_cumplimiento_sla',
            align: 'right',
            render: (value) => formatPct(Number(value)),
        },
        {
            header: '% Error',
            accessor: 'pct_error_proceso',
            align: 'right',
            render: (value) => formatPct(Number(value)),
        },
        {
            header: 'T. Prom',
            accessor: 'tiempo_promedio',
            align: 'right',
            render: (value) => formatHoras(Number(value)),
        },
        {
            header: 'Score',
            accessor: 'score_total',
            align: 'center',
            render: (value) => <ScoreBadge score={Number(value)} />,
        },
        {
            header: 'Estado',
            accessor: 'clasificacion',
            align: 'center',
            render: (value) => <ClasificacionDot clasificacion={String(value)} />,
        },
    ];

    const handleRowClick = useCallback((row: typeof filteredData[0]) => {
        const params = new URLSearchParams();
        if (dateRange.dateFrom) params.set('dateFrom', dateRange.dateFrom);
        if (dateRange.dateTo) params.set('dateTo', dateRange.dateTo);
        const query = params.toString();
        navigate(`/reports/dashboard/usuario/${row.usuario_id}${query ? `?${query}` : ''}`);
    }, [navigate, dateRange]);

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
        <div className="flex min-h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Ranking de Usuarios"
                subtitle="Desempeño individual por tickets gestionados y cumplimiento SLA."
                icon={<Icon name="emoji_events" className="text-2xl" />}
                actions={
                    <button
                        onClick={() => exportar('xlsx', 'ranking')}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#2B378A] text-white rounded-lg hover:bg-[#23468C] transition-colors disabled:opacity-50"
                    >
                        <Icon name="download" className="text-[1.1rem]" />
                        {exportLoading ? 'Exportando...' : 'Exportar Excel'}
                    </button>
                }
            >
                <div className="w-full sm:w-56">
                    <FiltroRegional
                        value={selectedRegional}
                        onChange={setSelectedRegional}
                        regionales={listRegionales}
                        placeholder="Todas las regionales"
                    />
                </div>
                <div className="relative flex-1 sm:flex-none sm:w-64 min-w-[160px]">
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
                <FiltroFecha value={dateRange} onChange={setDateRange} />
                <FiltroFilas value={limit} onChange={val => { setLimit(val); setPage(1); }} />
            </ReportHeader>

            {/* Content */}
            <div className="flex-1 px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto">

                {/* ── Info banner for score system ───────────────────────────── */}
                <div className="mb-5 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 shadow-sm">
                    <Icon name="info" className="text-blue-500 mt-0.5 text-[1.1rem]" />
                    <p>
                        <strong>¿Cómo funciona el Ranking?</strong> Premia a quien hace muchas cosas bien y penaliza fuerte a quien comete errores, sin importar cuántos tickets tenga. <br /><span className="opacity-80">Un usuario con 10 tickets perfectos es bueno, pero uno con 100 tickets casi perfectos es mejor. Y uno con muchos tickets pero lleno de errores cae al fondo sin importar su volumen.</span>
                    </p>
                </div>

                {/* Tabla */}
                <ReportTable
                    data={filteredData}
                    columns={columns}
                    onRowClick={handleRowClick}
                    isLoading={isLoading}
                    emptyMessage="No hay usuarios que coincidan con los filtros aplicados."
                    rowKey="usuario_id"
                />

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
