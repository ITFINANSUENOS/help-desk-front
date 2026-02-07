import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticket.service';
import type { Ticket, TicketStatus, TicketPriority } from '../interfaces/Ticket';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { DataTable } from '../../../shared/components/DataTable';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import TagManagementModal from '../components/TagManagementModal';
import { AdvancedTicketFilter } from '../components/AdvancedTicketFilter';
import type { TicketFilter } from '../interfaces/Ticket';

export default function TicketsPage() {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const { setTitle } = useLayout();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Tag Modal State
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'Todos'>('Todos');
    const [userPriorityFilter, setUserPriorityFilter] = useState<TicketPriority | 'Todas'>('Todas');
    const [subcategoryPriorityFilter, setSubcategoryPriorityFilter] = useState<TicketPriority | 'Todas'>('Todas');
    const [searchQuery, setSearchQuery] = useState('');
    const [advancedFilters, setAdvancedFilters] = useState<Partial<TicketFilter>>({});

    useEffect(() => {
        setTitle('Gestión de Tickets');
    }, [setTitle]);

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

        // Historial: Participated tickets (not currently assigned)
        if (can('view:assigned', 'Ticket') || can('view:created', 'Ticket')) {
            options.push({ label: 'Historial', value: 'history' });
        }

        // Si no tiene ningún permiso específico, al menos mostrar 'creados'
        if (options.length === 0) {
            options.push({ label: 'Creados por mí', value: 'created' });
        }

        return options;
    }, [can]);

    // Initialize viewFilter with the first available option based on permissions
    const [viewFilter, setViewFilter] = useState<'all' | 'created' | 'assigned' | 'observed' | 'history'>(() => {
        // This will be computed after viewOptions is available, but we need a default
        // We'll use 'created' as the safest default
        return 'created' as 'all' | 'created' | 'assigned' | 'observed' | 'history';
    });

    // Track if we've initialized the filter to prevent overriding user selection
    const filterInitialized = useRef(false);

    // Sync viewFilter with the first available option ONLY on initial load
    useEffect(() => {
        if (viewOptions.length > 0 && !filterInitialized.current) {
            const firstOption = viewOptions[0].value as 'all' | 'created' | 'assigned' | 'observed' | 'history';
            setViewFilter(firstOption);
            filterInitialized.current = true;
        }
    }, [viewOptions]);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                view: viewFilter,
                status: statusFilter === 'Todos' ? undefined : statusFilter,
                userPriority: userPriorityFilter === 'Todas' ? undefined : userPriorityFilter,
                subcategoryPriority: subcategoryPriorityFilter === 'Todas' ? undefined : subcategoryPriorityFilter,
                search: searchQuery,
                page,
                limit,
                ...advancedFilters
            };
            console.log('[TicketsPage] Fetching with params:', params);
            const response = await ticketService.getTickets(params);
            setTickets(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [viewFilter, statusFilter, userPriorityFilter, subcategoryPriorityFilter, searchQuery, page, limit, advancedFilters]);

    useEffect(() => {
        setPage(1);
    }, [viewFilter, statusFilter, userPriorityFilter, subcategoryPriorityFilter, searchQuery]);

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
            name: 'userPriority',
            value: userPriorityFilter,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange: (val) => setUserPriorityFilter(val as any),
            options: [
                { label: 'Prioridad Usuario (Todas)', value: 'Todas' },
                { label: 'Alta', value: 'Alta' },
                { label: 'Media', value: 'Media' },
                { label: 'Baja', value: 'Baja' }
            ]
        },
        {
            type: 'select',
            name: 'subcategoryPriority',
            value: subcategoryPriorityFilter,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange: (val) => setSubcategoryPriorityFilter(val as any),
            options: [
                { label: 'Prioridad Flujo (Todas)', value: 'Todas' },
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
            </div>

            <AdvancedTicketFilter
                filters={advancedFilters}
                onFilterChange={(newFilters) => {
                    setAdvancedFilters(newFilters);
                    setPage(1);
                }}
                onClear={() => {
                    setAdvancedFilters({});
                    setPage(1);
                }}
            />

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
                        header: 'Prioridad Usuario',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.priority).split(' ')[0]}`}></div>
                                <span className="font-medium text-gray-700">{ticket.priority}</span>
                            </div>
                        )
                    },
                    {
                        key: 'prioritySubcategory',
                        header: 'Prioridad Flujo',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.prioritySubcategory || 'Media').split(' ')[0]}`}></div>
                                <span className="font-medium text-gray-700">{ticket.prioritySubcategory || 'Media'}</span>
                            </div>
                        )
                    },
                    {
                        key: 'tags',
                        header: 'Etiquetas',
                        render: (ticket: Ticket) => (
                            <div className="flex flex-wrap gap-1 items-center">
                                {ticket.tags && ticket.tags.length > 0 ? (
                                    ticket.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10"
                                            style={{
                                                backgroundColor: tag.color + '20',
                                                color: tag.color,
                                                borderColor: tag.color + '40'
                                            }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-xs italic">Sin etiquetas</span>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTicketId(ticket.id);
                                        setIsTagModalOpen(true);
                                    }}
                                    className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-brand-blue"
                                    title="Gestionar etiquetas"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                </button>
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

            <TagManagementModal
                isOpen={isTagModalOpen}
                onClose={() => {
                    setIsTagModalOpen(false);
                    setSelectedTicketId(null);
                }}
                ticketId={selectedTicketId}
                currentTags={tickets.find(t => t.id === selectedTicketId)?.tags}
                onTagAssigned={fetchTickets}
            />
        </>
    );
}
