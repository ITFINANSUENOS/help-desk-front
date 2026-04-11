import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFilter } from '../components/ui/FiltroFecha';
import { FiltroFecha } from '../components/ui/FiltroFecha';
import { FiltroFilas } from '../components/ui/FiltroFilas';
import { UserSelect } from '../../users/components/UserSelect';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Icon } from '../../../shared/components/Icon';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { useTicketsDetallePorUsuario } from '../hooks/useDashboard';
import { formatHoras, formatFecha } from '../utils/formatters';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import type { TicketDetalleItem, AsignacionDetalle } from '../types/dashboard.types';
import { ReportHeader } from '../components/ui/ReportHeader';

export default function TicketsUsuarioPage() {
    const navigate = useNavigate();
    const { setTitle } = useLayout();
    const { dateRange, setDateRange } = useDateFilter();

    const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
    const [limit, setLimit] = useState(50);
    const [page, setPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [tipoFiltro, setTipoFiltro] = useState<'creados' | 'asignados' | undefined>();

    useEffect(() => {
        setTitle('Tickets por Usuario');
    }, [setTitle]);

    const { data, isLoading, isError, refetch } = useTicketsDetallePorUsuario(
        selectedUserId,
        dateRange,
        limit,
        page,
        tipoFiltro,
    );

    const toggleRow = useCallback((ticketId: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(ticketId)) next.delete(ticketId);
            else next.add(ticketId);
            return next;
        });
    }, []);

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'Cerrado':
                return 'bg-green-100 text-green-700';
            case 'Pausado':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-blue-100 text-blue-700';
        }
    };

    const renderExpandedRow = (ticket: TicketDetalleItem) => {
        if (!ticket.historial || ticket.historial.length === 0) {
            return (
                <tr>
                    <td colSpan={!tipoFiltro ? 7 : 6} className="px-4 py-3 text-center text-gray-500 text-sm">
                        No hay historial de asignaciones para este ticket.
                    </td>
                </tr>
            );
        }

        return (
            <>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={!tipoFiltro ? 7 : 6} className="px-4 py-2">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Creador: <span className="text-gray-700">{ticket.nombreCreador}</span>
                            </span>
                        </div>
                    </td>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={!tipoFiltro ? 7 : 6} className="px-4 py-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Personas que pasaron por este ticket
                        </span>
                    </td>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={!tipoFiltro ? 7 : 6} className="px-4 py-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <th className="pb-2 text-left pr-4">Usuario</th>
                                    <th className="pb-2 text-left pr-4">Paso</th>
                                    <th className="pb-2 text-left pr-4">Fecha Asignación</th>
                                    <th className="pb-2 text-right pr-4">Duración</th>
                                    <th className="pb-2 text-right pr-4">Límite SLA</th>
                                    <th className="pb-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticket.historial.map((asignacion: AsignacionDetalle) => (
                                    <tr key={asignacion.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                        <td className="py-2 pr-4 text-gray-700 font-medium">
                                            {asignacion.usuarioNombre}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {asignacion.pasoNombre}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-500">
                                            {formatFecha(asignacion.fechaAsignacion)}
                                        </td>
                                        <td className="py-2 pr-4 text-right text-gray-700 font-mono text-xs">
                                            {formatHoras(asignacion.duracionHoras)}
                                        </td>
                                        <td className="py-2 pr-4 text-right text-gray-500">
                                            {formatHoras(asignacion.slaLimiteHoras)}
                                        </td>
                                        <td className="py-2 text-center">
                                            <div className="flex justify-center">
                                                <ClasificacionDot
                                                    clasificacion={
                                                        asignacion.estadoTiempo === 'A Tiempo'
                                                            ? 'verde'
                                                            : asignacion.estadoTiempo === 'Atrasado'
                                                                ? 'rojo'
                                                                : 'amarillo'
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </td>
                </tr>
            </>
        );
    };

    return (
        <div className="flex h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Tickets por Usuario"
                icon={<Icon name="list_alt" className="text-2xl" />}
                actions={
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#2B378A] transition-colors"
                    >
                        <Icon name="arrow_back" className="text-[1.1rem]" />
                        Volver
                    </button>
                }
            >
                <div className="w-72">
                    <UserSelect
                        value={selectedUserId}
                        onChange={(val) => {
                            setSelectedUserId(val as number | undefined);
                            setPage(1);
                        }}
                        placeholder="Seleccione un usuario..."
                    />
                </div>
                <FiltroFecha value={dateRange} onChange={(range) => {
                    setDateRange(range);
                    setPage(1);
                }} />
                <FiltroFilas
                    value={limit}
                    onChange={(val) => {
                        setLimit(val);
                        setPage(1);
                    }}
                />
            </ReportHeader>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 py-6 lg:px-8 max-w-[1600px] w-full mx-auto overflow-y-auto">

                {/* Filtro por tipo: creados / asignados */}
                <div className="mb-4 flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => { setTipoFiltro(undefined); setPage(1); }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            tipoFiltro === undefined ? 'bg-white text-[#2B378A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => { setTipoFiltro('creados'); setPage(1); }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            tipoFiltro === 'creados' ? 'bg-purple-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Creados
                    </button>
                    <button
                        onClick={() => { setTipoFiltro('asignados'); setPage(1); }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            tipoFiltro === 'asignados' ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Asignados
                    </button>
                </div>

                {/* Tabla */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6">
                            <LoadingSkeleton rows={8} />
                        </div>
                    ) : isError ? (
                        <EmptyState
                            icon="report_problem"
                            title="Error al cargar los tickets"
                            description="No se pudo cargar la información. Intenta nuevamente."
                            action={{
                                label: 'Reintentar',
                                onClick: () => { void refetch(); },
                            }}
                        />
                    ) : !data?.data || data.data.length === 0 ? (
                        <EmptyState
                            icon="confirmation_number"
                            title="Sin tickets"
                            description={
                                selectedUserId
                                    ? 'No hay tickets para este usuario en el período seleccionado.'
                                    : 'Seleccione un usuario para ver sus tickets.'
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4 w-10"></th>
                                        <th className="py-3 px-4">Ticket</th>
                                        <th className="py-3 px-4">Título</th>
                                        <th className="py-3 px-4">Estado</th>
                                        <th className="py-3 px-4">Categoría</th>
                                        {!tipoFiltro && <th className="py-3 px-4">Tipo</th>}
                                        <th className="py-3 px-4 text-right">Fecha Creación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.data.map((ticket: TicketDetalleItem) => {
                                        const isExpanded = expandedRows.has(ticket.id);
                                        return (
                                            <React.Fragment key={ticket.id}>
                                                <tr
                                                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                                                        isExpanded ? 'bg-blue-50' : ''
                                                    }`}
                                                    onClick={() => toggleRow(ticket.id)}
                                                >
                                                    <td className="py-3 px-4 text-center">
                                                        <Icon
                                                            name={isExpanded ? 'expand_less' : 'expand_more'}
                                                            className="text-gray-400 text-lg"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 text-brand-teal font-medium">
                                                        <span
                                                            className="hover:underline cursor-pointer"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                                                        >
                                                            #{ticket.id}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-800 max-w-xs truncate">
                                                        {ticket.titulo}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(ticket.estado)}`}>
                                                            {ticket.estado}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {[ticket.categoria, ticket.subcategoria].filter(Boolean).join(' / ')}
                                                    </td>
                                                    {!tipoFiltro && (
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {ticket.esCreadoPorUsuario && (
                                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                                        Creado
                                                                    </span>
                                                                )}
                                                                {ticket.esAsignadoAUsuario && (
                                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">
                                                                        Asignado
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-4 text-right text-gray-500 text-sm">
                                                        {formatFecha(ticket.fechaCreacion)}
                                                    </td>
                                                </tr>
                                                {isExpanded && renderExpandedRow(ticket)}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {data && data.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)} de {data.total} tickets
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {page} de {data.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
