
import { Link } from 'react-router-dom';
import { cn } from '../../../shared/lib/utils';
import { DataTable } from '../../../shared/components/DataTable';
import type { RecentTicket } from '../services/dashboard.service';

interface TicketTableProps {
    tickets: RecentTicket[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Abierto':
        case 'Open':
            return 'bg-cyan-50 text-brand-teal';
        case 'Pausado':
        case 'In Progress':
            return 'bg-blue-50 text-brand-accent';
        case 'Cerrado':
        case 'Closed':
            return 'bg-green-50 text-green-700';
        default:
            return 'bg-gray-50 text-gray-600';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'Alta':
        case 'High':
            return { text: 'text-brand-red', dot: 'bg-brand-red' };
        case 'Media':
        case 'Medium':
            return { text: 'text-orange-500', dot: 'bg-orange-500' };
        case 'Baja':
        case 'Low':
            return { text: 'text-green-600', dot: 'bg-green-600' };
        default:
            return { text: 'text-gray-500', dot: 'bg-gray-500' };
    }
};

export function TicketTable({ tickets }: TicketTableProps) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="mt-8 text-center text-gray-500">
                No recent tickets found.
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-800">Próximos Tickets Asignados</h3>
                {/* <a className="text-sm font-bold text-brand-teal hover:text-brand-accent" href="/tickets">Ver todos</a> */}
            </div>
            <DataTable<RecentTicket>
                data={tickets}
                getRowKey={(ticket) => ticket.id}
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        className: 'px-6 py-4 font-mono font-medium text-gray-900',
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
                        render: (ticket) => {
                            const colors = getPriorityColor(ticket.priority);
                            return (
                                <div className={cn("flex items-center gap-1.5", colors.text)}>
                                    <div className={cn("h-2 w-2 rounded-full", colors.dot)}></div>
                                    <span className="font-medium">{ticket.priority}</span>
                                </div>
                            );
                        }
                    },
                    {
                        key: 'date',
                        header: 'Asignado',
                        render: (t) => new Date(t.date).toLocaleDateString()
                    }
                ]}
            />
        </div>
    );
}
