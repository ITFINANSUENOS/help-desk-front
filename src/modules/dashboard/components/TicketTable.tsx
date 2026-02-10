
import { Link } from 'react-router-dom';
import { cn } from '../../../shared/lib/utils';
import { DataTable } from '../../../shared/components/DataTable';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { RecentTicket } from '../services/dashboard.service';

interface TicketTableProps {
    tickets: RecentTicket[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Abierto':
        case 'Open':
            return 'bg-cyan-100 text-cyan-800';
        case 'Pausado':
        case 'In Progress':
            return 'bg-blue-100 text-blue-800';
        case 'Cerrado':
        case 'Closed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'Alta':
        case 'High':
            return 'bg-red-100 text-red-800';
        case 'Media':
        case 'Medium':
            return 'bg-orange-100 text-orange-800';
        case 'Baja':
        case 'Low':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export function TicketTable({ tickets }: TicketTableProps) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="mt-8">
                <EmptyState
                    icon="inbox"
                    title="No hay tickets asignados"
                    description="No tienes tickets asignados en este momento. Los nuevos tickets aparecerán aquí cuando sean asignados a ti."
                />
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-800">Próximos Tickets Asignados</h3>
                {/* <a className="text-sm font-bold text-brand-teal hover:text-brand-accent" href="/tickets">Ver todos</a> */}
            </div>
            <div className="max-h-[600px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <DataTable<RecentTicket>
                    data={tickets}
                    getRowKey={(ticket) => ticket.id}
                    columns={[
                        {
                            key: 'id',
                            header: 'ID',
                            className: 'w-24 px-4 py-4 font-mono font-medium text-gray-900',
                            render: (t) => (
                                <Link to={`/tickets/${t.id}`} className="text-brand-blue hover:underline">
                                    #{t.id}
                                </Link>
                            )
                        },
                        {
                            key: 'title',
                            header: 'Asunto',
                            className: 'px-6 py-4 font-medium text-gray-800',
                            render: (t) => (
                                <Link to={`/tickets/${t.id}`} className="hover:text-brand-blue transition-colors">
                                    {t.title}
                                </Link>
                            )
                        },
                        {
                            key: 'customer',
                            header: 'Cliente / Creador'
                        },
                        {
                            key: 'step',
                            header: 'Paso Actual',
                            className: 'px-6 py-4 text-gray-600'
                        },
                        {
                            key: 'status',
                            header: 'Estado',
                            render: (ticket) => (
                                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getStatusColor(ticket.status))}>
                                    {ticket.status}
                                </span>
                            )
                        },
                        {
                            key: 'priority',
                            header: 'Prioridad',
                            render: (ticket) => (
                                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getPriorityColor(ticket.priority))}>
                                    {ticket.priority}
                                </span>
                            )
                        },
                        {
                            key: 'date',
                            header: 'Asignado',
                            render: (t) => new Date(t.date).toLocaleDateString()
                        }
                    ]}
                />
            </div>
        </div>
    );
}
