import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopPerformers } from '../hooks/useDashboard';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatHoras, formatPct, formatNumero } from '../utils/formatters';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { useEffect } from 'react';

/** Renders the position cell for the top-performers table.
 * Positions 1-3 get coloured medal icons; rest show a plain number. */
function PodiumCell({ position, isTop }: { position: number; isTop: boolean }) {
    if (!isTop) {
        return (
            <div className="flex items-center justify-center">
                <Icon name="error" className="text-red-500 text-[1.1rem]" />
            </div>
        );
    }

    if (position === 1) {
        return (
            <div className="flex items-center justify-center">
                <Icon name="workspace_premium" className="text-yellow-400 text-xl" title="1.º lugar — Oro" />
            </div>
        );
    }
    if (position === 2) {
        return (
            <div className="flex items-center justify-center">
                <Icon name="workspace_premium" className="text-gray-400 text-xl" title="2.º lugar — Plata" />
            </div>
        );
    }
    if (position === 3) {
        return (
            <div className="flex items-center justify-center">
                <Icon name="workspace_premium" className="text-amber-600 text-xl" title="3.º lugar — Bronce" />
            </div>
        );
    }

    return (
        <span className="text-sm font-semibold text-gray-500">
            #{position}
        </span>
    );
}

export default function TopPerformers() {
    const navigate = useNavigate();
    const [type, setType] = useState<'top' | 'bottom'>('top');
    const { dateRange, setDateRange } = useDateFilter();
    const { setTitle } = useLayout();

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    const { data, isLoading, isError, refetch } = useTopPerformers(type, 10, dateRange);

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar los datos"
                    description="No se pudieron cargar los performers. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    const isTop = type === 'top';

    return (
        <div className="flex h-full flex-col bg-gray-50/50">
            {/* ── Sticky Header ────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 px-6 py-5 lg:px-8 border-b border-gray-100 bg-white/60 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm border border-blue-100">
                            {isTop
                                ? <Icon name="emoji_events" className="text-2xl" />
                                : <Icon name="warning" className="text-2xl" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                {isTop ? 'Top Performers' : 'Usuarios que Necesitan Apoyo'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {isTop
                                    ? 'Los 10 usuarios con mejor desempeño global.'
                                    : 'Los 10 usuarios con menor desempeño (mínimo 10 tickets gestionados).'}
                            </p>
                        </div>
                    </div>

                    {/* ── Toggle ───────────────────────────────────────────────── */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setType('top')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'top'
                                ? 'bg-[#2B378A] text-white shadow'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2B378A] hover:text-[#2B378A]'
                                }`}
                        >
                            <Icon name="emoji_events" className={type === 'top' ? 'text-yellow-400' : ''} />
                            TOP 10
                        </button>
                        <button
                            onClick={() => setType('bottom')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'bottom'
                                ? 'bg-[#2B378A] text-white shadow'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2B378A] hover:text-[#2B378A]'
                                }`}
                        >
                            <Icon name="warning" className={type === 'bottom' ? 'text-amber-500' : ''} />
                            APOYO
                        </button>
                    </div>
                    <FiltroFecha value={dateRange} onChange={setDateRange} />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto overflow-y-auto">

                {/* ── Info banner for score system ───────────────────────────── */}
                <div className="mb-5 flex items-start gap-2 rounded-lg bg-blue-50/80 border border-blue-100 px-4 py-3 text-sm text-blue-900">
                    <Icon name="info" className="text-blue-500 mt-0.5 text-[1.1rem]" />
                    <p>
                        <strong>¿Cómo funciona el Ranking?</strong> Premia a quien hace muchas cosas bien y penaliza fuerte a quien comete errores, sin importar cuántos tickets tenga. <span className="opacity-80 block mt-0.5">Un usuario con 10 tickets perfectos es bueno, pero uno con 100 tickets casi perfectos es mejor. Y uno con muchos tickets pero lleno de errores cae al fondo sin importar su volumen.</span>
                    </p>
                </div>

                {/* ── Info banner for bottom view ───────────────────────────── */}
                {!isTop && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                        <Icon name="warning" className="mt-0.5 shrink-0 text-[1.1rem] text-amber-500" />
                        <span>
                            Usuarios con <strong>mínimo 10 tickets gestionados</strong>. Estos usuarios
                            presentan el menor puntaje global y pueden requerir acompañamiento o capacitación.
                        </span>
                    </div>
                )}

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6">
                            <LoadingSkeleton rows={10} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4 text-center w-14">#</th>
                                        <th className="py-3 px-4">Usuario</th>
                                        <th className="py-3 px-4">Regional</th>
                                        <th className="py-3 px-4 text-right">Tickets</th>
                                        <th className="py-3 px-4 text-right">% SLA</th>
                                        <th className="py-3 px-4 text-right">% Error</th>
                                        <th className="py-3 px-4 text-right">T. Prom</th>
                                        <th className="py-3 px-4 text-center">Score</th>
                                        <th className="py-3 px-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {!data || data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="py-12 text-center text-gray-500 text-sm"
                                            >
                                                No hay datos disponibles para este período.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row, idx) => {
                                            const position = idx + 1;
                                            // First 3 rows get a subtle podium highlight in top view
                                            const isPodium = isTop && position <= 3;
                                            const rowBg = isPodium
                                                ? position === 1
                                                    ? 'bg-yellow-50/60'
                                                    : position === 2
                                                        ? 'bg-gray-50/80'
                                                        : 'bg-amber-50/40'
                                                : idx % 2 === 0
                                                    ? 'bg-white'
                                                    : 'bg-gray-50/60';

                                            return (
                                                <tr
                                                    key={row.usuario_id}
                                                    onClick={() =>
                                                        navigate(
                                                            `/reports/dashboard/usuario/${row.usuario_id}`
                                                        )
                                                    }
                                                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${rowBg}`}
                                                >
                                                    {/* Position */}
                                                    <td className="py-3 px-4 text-center">
                                                        <PodiumCell position={position} isTop={isTop} />
                                                    </td>

                                                    {/* Name + cargo */}
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {row.usuario_nombre}
                                                        </span>
                                                        {row.cargo && (
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {row.cargo}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Regional */}
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {row.regional}
                                                    </td>

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
                                                            <ClasificacionDot
                                                                clasificacion={row.clasificacion}
                                                            />
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

                {/* ── Footer legend ─────────────────────────────────────────── */}
                {isTop && !isLoading && data && data.length > 0 && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Icon name="workspace_premium" className="text-[1.1rem] text-yellow-400" /> 1.º — Oro
                        </span>
                        <span className="flex items-center gap-1">
                            <Icon name="workspace_premium" className="text-[1.1rem] text-gray-400" /> 2.º — Plata
                        </span>
                        <span className="flex items-center gap-1">
                            <Icon name="workspace_premium" className="text-[1.1rem] text-amber-600" /> 3.º — Bronce
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
