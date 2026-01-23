import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticket.service';
import type { Ticket, TicketStatus, TicketPriority } from '../interfaces/Ticket';
import { Button } from '../../../shared/components/Button';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { DataTable } from '../../../shared/components/DataTable';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useLayout } from '../../../core/layout/context/LayoutContext';

export default function TicketsPage() {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const { setTitle } = useLayout();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [viewFilter, setViewFilter] = useState<'all' | 'created' | 'assigned'>('all');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'Todos'>('Todos');
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'Todas'>('Todas');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setTitle('Gestión de tickets');
    }, [setTitle]);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ticketService.getTickets({
                view: viewFilter,
                status: statusFilter === 'Todos' ? undefined : statusFilter,
                priority: priorityFilter === 'Todas' ? undefined : priorityFilter,
                search: searchQuery,
                page,
                limit
            });
            setTickets(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [viewFilter, statusFilter, priorityFilter, searchQuery, page, limit]);

    useEffect(() => {
        setPage(1);
    }, [viewFilter, statusFilter, priorityFilter, searchQuery]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchTickets]);

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'Abierto': return 'bg-green-100 text-green-800';
            // case 'En Progreso': return 'bg-blue-100 text-blue-800'; // Not in TicketStatus type
            case 'Pausado': return 'bg-yellow-100 text-yellow-800';
            case 'Cerrado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'Alta': return 'bg-red-500 text-red-500';
            case 'Media': return 'bg-yellow-500 text-yellow-500';
            case 'Baja': return 'bg-green-500 text-green-500';
            default: return 'bg-gray-400 text-gray-400';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-100 text-red-700',
            'bg-green-100 text-green-700',
            'bg-blue-100 text-blue-700',
            'bg-yellow-100 text-yellow-700',
            'bg-purple-100 text-purple-700',
            'bg-pink-100 text-pink-700',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Construir opciones de vista basadas en permisos
    const viewOptions = useMemo(() => {
        const options: Array<{ label: string; value: string }> = [];

        if (can('view:all', 'Ticket')) {
            options.push({ label: 'Todos los Tickets', value: 'all' });
        }
        if (can('view:created', 'Ticket')) {
            options.push({ label: 'Creados por mí', value: 'created' });
        }
        if (can('view:assigned', 'Ticket')) {
            options.push({ label: 'Asignados a mí', value: 'assigned' });
        }
        if (can('view:observed', 'Ticket')) {
            options.push({ label: 'Observados', value: 'observed' });
        }

        // Si no tiene ningún permiso específico, al menos mostrar 'creados'
        if (options.length === 0) {
            options.push({ label: 'Creados por mí', value: 'created' });
        }

        return options;
    }, [can]);

    const filterConfig: FilterConfig[] = [
        {
            type: 'search',
            name: 'search',
            placeholder: 'Buscar por ID, asunto o cliente...',
            value: searchQuery,
            onChange: (val) => setSearchQuery(val as string)
        },
        {
            type: 'select',
            name: 'view',
            value: viewFilter,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange: (val) => setViewFilter(val as any),
            options: viewOptions
        },
        {
            type: 'select',
            name: 'status',
            value: statusFilter,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange: (val) => setStatusFilter(val as any),
            options: [
                { label: 'Todos los Estados', value: 'Todos' },
                { label: 'Abierto', value: 'Abierto' },
                { label: 'Pausado', value: 'Pausado' },
                { label: 'Cerrado', value: 'Cerrado' }
            ]
        },
        {
            type: 'select',
            name: 'priority',
            value: priorityFilter,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange: (val) => setPriorityFilter(val as any),
            options: [
                { label: 'Todas las Prioridades', value: 'Todas' },
                { label: 'Alta', value: 'Alta' },
                { label: 'Media', value: 'Media' },
                { label: 'Baja', value: 'Baja' }
            ]
        }
    ];

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
                    <p className="mt-1 text-sm text-gray-500">Gestiona solicitudes de soporte y sigue su progreso.</p>
                </div>
                <Button variant="brand" className="shadow-sm" onClick={() => navigate('/tickets/create')}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Ticket
                </Button>
            </div>

            <FilterBar filters={filterConfig} className="mb-6" />

            <DataTable<Ticket>
                data={tickets}
                loading={loading}
                emptyMessage="No se encontraron tickets con los filtros aplicados."
                loadingMessage="Cargando tickets..."
                getRowKey={(ticket) => ticket.id}
                onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
                pagination={{
                    page,
                    limit,
                    total,
                    totalPages,
                    onPageChange: setPage
                }}
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        className: 'px-6 py-4 font-mono font-medium text-gray-900',
                        render: (ticket: Ticket) => `#TK-${ticket.id}`
                    },
                    {
                        key: 'subject',
                        header: 'Asunto',
                        render: (ticket: Ticket) => (
                            <div>
                                <p className="font-medium text-gray-900">{ticket.subject}</p>
                                <p className="text-xs text-gray-500">Ticket #{ticket.id}</p>
                            </div>
                        )
                    },
                    {
                        key: 'customer',
                        header: 'Cliente',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(ticket.customer)}`}>
                                    {ticket.customerInitials || getInitials(ticket.customer)}
                                </div>
                                <span className="font-medium text-gray-900">{ticket.customer}</span>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        header: 'Estado',
                        render: (ticket: Ticket) => (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                        )
                    },
                    {
                        key: 'priority',
                        header: 'Prioridad',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.priority).split(' ')[0]}`}></div>
                                <span className="font-medium text-gray-700">{ticket.priority}</span>
                            </div>
                        )
                    },
                    {
                        key: 'lastUpdated',
                        header: 'Última Actualización',
                        render: (ticket: Ticket) => <span className="text-gray-500">{ticket.lastUpdated}</span>
                    },
                    {
                        key: 'actions',
                        header: 'Acciones',
                        className: 'px-6 py-4 text-right',
                        render: () => (
                            <div className="flex justify-end">
                                <button
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-blue"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        )
                    }
                ]}
            />
        </>
    );
}
