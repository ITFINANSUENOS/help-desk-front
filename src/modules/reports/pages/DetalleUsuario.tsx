import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDetalleUsuario, useTicketsPorUsuario } from '../hooks/useDashboard';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { KPICard } from '../components/ui/KPICard';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import {
    formatHoras,
    formatPct,
    formatNumero,
} from '../utils/formatters';
import type { DetallePaso } from '../types/dashboard.types';
import {
    getClasificacionCumplimiento,
    getClasificacionErrores,
} from '../utils/colores';

// ─── ScoreGauge ──────────────────────────────────────────────────────────
/**
 * Renders a simple SVG semicircular gauge that visually represents the score
 * from 0–100. No external library is used — built with SVG path arcs.
 */
function ScoreGauge({ score }: { score: number }) {
    const clampedScore = Math.min(100, Math.max(0, score));

    // Map score 0-100 → angle 0-180 degrees on the semicircle
    const angle = (clampedScore / 100) * 180;

    // Centre of the SVG viewBox is (100, 100); radius of the arc is 80
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startX = 100 + 80 * Math.cos(toRad(180));   // = 20
    const startY = 100 + 80 * Math.sin(toRad(180));   // = 100

    const endRad = toRad(180 + angle);
    const endX = 100 + 80 * Math.cos(endRad);
    const endY = 100 + 80 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    // Pick arc colour based on score threshold
    const arcColor =
        clampedScore >= 90 ? '#22c55e' :
            clampedScore >= 75 ? '#eab308' :
                '#ef4444';

    return (
        <svg viewBox="0 0 200 110" className="w-48 h-24">
            {/* Background arc (full semicircle) */}
            <path
                d={`M 20 100 A 80 80 0 0 1 180 100`}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="14"
                strokeLinecap="round"
            />
            {/* Coloured progress arc */}
            {clampedScore > 0 && (
                <path
                    d={`M ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY}`}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth="14"
                    strokeLinecap="round"
                />
            )}
            {/* Score text */}
            <text
                x="100"
                y="90"
                textAnchor="middle"
                fontSize="28"
                fontWeight="bold"
                fill={arcColor}
            >
                {clampedScore.toFixed(1)}
            </text>
            <text x="100" y="108" textAnchor="middle" fontSize="11" fill="#6b7280">
                Score
            </text>
        </svg>
    );
}

// ─── Avatar con iniciales ────────────────────────────────────────────────
/** Generates a two-letter avatar from the user's full name. */
function Avatar({ nombre }: { nombre: string | null }) {
    if (!nombre) {
        return (
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-300 text-white text-xl font-bold shrink-0">
                ?
            </div>
        );
    }
    const parts = nombre.trim().split(' ');
    const initials =
        parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : nombre.slice(0, 2).toUpperCase();

    return (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2B378A] text-white text-xl font-bold shrink-0">
            {initials}
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────
export default function DetalleUsuario() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { setTitle } = useLayout();
    const { dateRange, setDateRange } = useDateFilter();

    const userId = Number(id);

    useEffect(() => {
        setTitle('Dashboard Analytics');
    }, [setTitle]);

    const {
        data: detalle,
        isLoading: loadingDetalle,
        isError: errorDetalle,
        refetch: refetchDetalle,
    } = useDetalleUsuario(userId, dateRange);

    const [showTickets, setShowTickets] = useState(false);
    const [selectedPaso, setSelectedPaso] = useState<string | null>(null);

    const {
        data: ticketsData,
        isLoading: loadingTickets,
        refetch: refetchTickets,
    } = useTicketsPorUsuario(userId, dateRange);

    const {
        data: pasoTicketsData,
        isLoading: loadingPasoTickets,
    } = useTicketsPorUsuario(userId, dateRange, 50, 1, selectedPaso ?? undefined);

    const loadTickets = async () => {
        if (!userId) return;
        await refetchTickets();
    };

    useEffect(() => {
        if (showTickets) {
            loadTickets();
        }
    }, [showTickets, userId, dateRange.dateFrom, dateRange.dateTo]);

    // ── Error state ──────────────────────────────────────────────────────
    if (errorDetalle) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar el detalle"
                    description="No se pudo cargar la información del usuario. Intenta nuevamente."
                    action={{
                        label: 'Reintentar',
                        onClick: () => {
                            void refetchDetalle();
                        },
                    }}
                />
            </div>
        );
    }

    const clasificacionSla = detalle
        ? getClasificacionCumplimiento(detalle.pct_cumplimiento_sla)
        : undefined;

    const clasificacionError = detalle
        ? getClasificacionErrores(detalle.pct_error_proceso)
        : undefined;

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto min-h-0">

            {/* ── Breadcrumb + Back button ─────────────────────────────── */}
            <div className="mb-6 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#2B378A] transition-colors"
                >
                    <Icon name="arrow_back" className="text-[1.1rem]" />
                    Volver
                </button>
                <span className="text-gray-300">/</span>
                <nav className="text-sm text-gray-400 flex items-center gap-1">
                    <button
                        onClick={() => navigate('/reports/dashboard')}
                        className="hover:text-[#2B378A] transition-colors"
                    >
                        Dashboard
                    </button>
                    <span className="mx-1">&rsaquo;</span>
                    <button
                        onClick={() => navigate('/reports/dashboard/ranking')}
                        className="hover:text-[#2B378A] transition-colors"
                    >
                        Ranking
                    </button>
                    <span className="mx-1">&rsaquo;</span>
                    <span className="font-medium text-gray-700">
                        {loadingDetalle ? '…' : (detalle?.usuario_nombre ?? 'Sin datos en el período')}
                    </span>
                </nav>
            </div>

            {/* ── Filtro de fechas ───────────────────────────────────── */}
            <div className="mb-4 flex justify-end">
                <FiltroFecha value={dateRange} onChange={setDateRange} />
            </div>

            {/* ── Row 1: Profile card + Score gauge ───────────────────── */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Profile card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
                    {loadingDetalle ? (
                        <div className="w-full"><LoadingSkeleton rows={3} /></div>
                    ) : detalle ? (
                        <>
                            <Avatar nombre={detalle.usuario_nombre} />
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                    {detalle.usuario_nombre ?? 'Usuario sin datos'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {[detalle.rol, detalle.cargo].filter(Boolean).join(' · ')}
                                </p>
                                <p className="text-sm text-[#2B378A] font-medium mt-1">
                                    {detalle.regional ?? '—'}
                                </p>
                                <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                                    <Icon name="bar_chart" className="text-[1.1rem]" />
                                    Ranking actual:{' '}
                                    <span className="font-semibold text-gray-700 ml-1">
                                        #{detalle.ranking ?? '—'}
                                    </span>
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Score gauge card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-2">
                    {loadingDetalle ? (
                        <div className="w-full"><LoadingSkeleton rows={2} /></div>
                    ) : detalle ? (
                        <>
                            <ScoreGauge score={detalle.score_total} />
                            <div className="mt-1">
                                <ScoreBadge score={detalle.score_total} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Desempeño global</p>
                        </>
                    ) : null}
                </div>
            </div>

            {/* ── Row 2: 4 KPI Cards ──────────────────────────────────── */}
            <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    titulo="Tickets Gestionados"
                    valor={loadingDetalle ? '…' : formatNumero(detalle?.tickets_gestionados ?? 0)}
                    icono="confirmation_number"
                    isLoading={loadingDetalle}
                />
                <KPICard
                    titulo="% Cumplimiento SLA"
                    valor={loadingDetalle ? '…' : formatPct(detalle?.pct_cumplimiento_sla ?? 0)}
                    icono="my_location"
                    clasificacion={clasificacionSla}
                    isLoading={loadingDetalle}
                />
                <KPICard
                    titulo="% Error Proceso"
                    valor={loadingDetalle ? '…' : formatPct(detalle?.pct_error_proceso ?? 0)}
                    icono="warning"
                    clasificacion={clasificacionError}
                    isLoading={loadingDetalle}
                />
                <KPICard
                    titulo="Tiempo Promedio"
                    valor={loadingDetalle ? '…' : formatHoras(detalle?.tiempo_promedio ?? 0)}
                    icono="schedule"
                    isLoading={loadingDetalle}
                />
            </div>

            {/* ── Row 3: Workflow step performance table ───────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {/* Table header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-[#2B378A]">
                        <Icon name="person" className="text-[1.1rem]" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">
                        Desempeño por Paso de Flujo
                    </h3>
                </div>

                {loadingDetalle ? (
                    <div className="p-6">
                        <LoadingSkeleton rows={6} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4">Paso de Flujo</th>
                                    <th className="py-3 px-4 text-right">Veces Asignado</th>
                                    <th className="py-3 px-4 text-right">Duración Prom.</th>
                                    <th className="py-3 px-4 text-right">% Cumplimiento</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!detalle?.detalle_por_paso || detalle.detalle_por_paso.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-12 text-center text-gray-500 text-sm"
                                        >
                                            No hay datos de pasos de flujo para este usuario.
                                        </td>
                                    </tr>
                                ) : (
                                    detalle.detalle_por_paso
                                        .slice()
                                        .sort((a: DetallePaso, b: DetallePaso) => b.veces_asignado - a.veces_asignado)
                                        .map((paso: DetallePaso, idx: number) => {
                                            const clasSla = getClasificacionCumplimiento(
                                                paso.pct_cumplimiento,
                                            );
                                            const isSelected = selectedPaso === paso.paso_flujo;
                                            return (
                                                <>
                                                    <tr
                                                        key={`${paso.paso_flujo}-${idx}`}
                                                        onClick={() => setSelectedPaso(isSelected ? null : paso.paso_flujo)}
                                                        className={`cursor-pointer transition-colors ${
                                                            idx % 2 === 0
                                                                ? 'bg-white hover:bg-blue-50'
                                                                : 'bg-gray-50/60 hover:bg-blue-50'
                                                        } ${isSelected ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <td className="py-3 px-4 text-sm font-medium text-gray-800">
                                                            {paso.paso_flujo}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-right text-gray-700 font-semibold">
                                                            {formatNumero(paso.veces_asignado)}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                                                            {formatHoras(paso.duracion_promedio)}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                                                            {formatPct(paso.pct_cumplimiento)}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex justify-center">
                                                                <ClasificacionDot
                                                                    clasificacion={clasSla}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isSelected && (
                                                        <tr key={`${paso.paso_flujo}-${idx}-expanded`}>
                                                            <td colSpan={5} className="bg-blue-50/50 px-4 py-3">
                                                                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                                                    Tickets donde "{paso.paso_flujo}"
                                                                </div>
                                                                {loadingPasoTickets ? (
                                                                    <div className="py-4 text-center text-gray-400 text-sm">Cargando...</div>
                                                                ) : !pasoTicketsData?.data || pasoTicketsData.data.length === 0 ? (
                                                                    <div className="py-4 text-center text-gray-400 text-sm">No hay tickets para este paso.</div>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        {pasoTicketsData.data.map(ticket => (
                                                                            <div
                                                                                key={ticket.id}
                                                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                                                className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                                                            >
                                                                                <span className="text-brand-teal font-medium text-sm">#{ticket.id}</span>
                                                                                <span className="text-gray-700 text-sm truncate flex-1">{ticket.titulo}</span>
                                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                                    ticket.estado === 'Cerrado' ? 'bg-green-100 text-green-700' :
                                                                                    ticket.estado === 'Pausado' ? 'bg-yellow-100 text-yellow-700' :
                                                                                    'bg-blue-100 text-blue-700'
                                                                                }`}>
                                                                                    {ticket.estado}
                                                                                </span>
                                                                                <span className="text-gray-400 text-xs">
                                                                                    {ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleDateString('es-CO') : '—'}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Row 4: Tickets del Usuario ──────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div
                    className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setShowTickets(s => !s)}
                >
                    <div className="p-1.5 bg-teal-50 rounded-lg text-brand-teal">
                        <Icon name="confirmation_number" className="text-[1.1rem]" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 flex-1">
                        Tickets Recientes del Usuario
                    </h3>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Icon name={showTickets ? 'expand_less' : 'expand_more'} className="text-lg" />
                        {showTickets ? 'Ocultar' : 'Ver'}
                    </span>
                </div>

                {showTickets && (
                    <div className="overflow-x-auto">
                        {loadingTickets ? (
                            <div className="p-6"><LoadingSkeleton rows={5} /></div>
                        ) : !ticketsData?.data || ticketsData.data.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 text-sm">
                                No hay tickets para este usuario en el período seleccionado.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="py-3 px-4">Ticket</th>
                                        <th className="py-3 px-4">Título</th>
                                        <th className="py-3 px-4">Estado</th>
                                        <th className="py-3 px-4">Categoría</th>
                                        <th className="py-3 px-4 text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ticketsData.data.map(ticket => (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-3 px-4 text-brand-teal font-medium hover:underline">
                                                #{ticket.id}
                                            </td>
                                            <td className="py-3 px-4 text-gray-800 max-w-xs truncate">
                                                {ticket.titulo}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    ticket.estado === 'Cerrado' ? 'bg-green-100 text-green-700' :
                                                    ticket.estado === 'Pausado' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {ticket.estado}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {[ticket.categoria, ticket.subcategoria].filter(Boolean).join(' / ')}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-500 text-sm">
                                                {ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleDateString('es-CO') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
