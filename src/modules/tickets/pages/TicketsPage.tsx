import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ticketService } from '../services/ticket.service';
import type { Ticket, TicketStatus, TicketPriority } from '../interfaces/Ticket';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { DataTable } from '../../../shared/components/DataTable';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import TagManagementModal from '../components/TagManagementModal';
import ReopenTicketModal from '../components/ReopenTicketModal';
import { AdvancedTicketFilter } from '../components/AdvancedTicketFilter';
import type { TicketFilter } from '../interfaces/Ticket';

export default function TicketsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { can } = usePermissions();
    const { setTitle } = useLayout();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Tag Modal State
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

    // Reopen Modal State
    const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
    const [ticketToReopen, setTicketToReopen] = useState<number | null>(null);

    // Derived State from URL
    const page = Number(searchParams.get('page')) || 1;
    const limit = 10; // Fixed limit for now
    const [total, setTotal] = useState(0); // Kept for pagination total from API
    const [totalPages, setTotalPages] = useState(1);

    const statusFilter = (searchParams.get('status') as TicketStatus | 'Todos') || 'Todos';
    const userPriorityFilter = (searchParams.get('userPriority') as TicketPriority | 'Todas') || 'Todas';
    const subcategoryPriorityFilter = (searchParams.get('subcategoryPriority') as TicketPriority | 'Todas') || 'Todas';
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastUpdated';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Advanced Filters Derived
    const advancedFilters = useMemo(() => {
        const filters: Partial<TicketFilter> = {};
        const knownKeys = ['messageSearch', 'creatorId', 'assigneeId', 'companyId', 'subcategoryId', 'tagId', 'ticketId', 'dateFrom', 'dateTo'];
        searchParams.forEach((value, key) => {
            if (knownKeys.includes(key)) {
                if (['creatorId', 'assigneeId', 'companyId', 'subcategoryId', 'tagId', 'ticketId'].includes(key)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (filters as any)[key] = Number(value);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (filters as any)[key] = value;
                }
            }
        });
        return filters;
    }, [searchParams]);

    // View Options (Permissions)
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

        if (can('view:assigned', 'Ticket') || can('view:created', 'Ticket')) {
            options.push({ label: 'Historial', value: 'history' });
        }

        if (can('view:assigned', 'Ticket') || can('view:created', 'Ticket') || can('view:all', 'Ticket')) {
            options.push({ label: 'Reabiertos', value: 'reopened' });
        }

        if (can('view:assigned', 'Ticket') || can('view:created', 'Ticket')) {
            options.push({ label: 'Errores que reporté', value: 'errors_reported' });
            options.push({ label: 'Errores asignados a mí', value: 'errors_received' });
        }

        if (options.length === 0) {
            options.push({ label: 'Creados por mí', value: 'created' });
        }

        return options;
    }, [can]);

    // View Filter Derived
    // Default to 'created' if no URL param, but effect below will correct it based on permissions
    const viewFilter = (searchParams.get('view') || 'created') as NonNullable<TicketFilter['view']>;

    // Track initialization
    const filterInitialized = useRef(false);

    // Initialize View Filter if missing or invalid
    useEffect(() => {
        if (viewOptions.length > 0 && !filterInitialized.current) {
            const search = window.location.search;
            const params = new URLSearchParams(search);
            const urlView = params.get('view');

            // Only force default if URL param is completely missing
            if (!urlView) {
                const defaultView = viewOptions[0].value;
                setSearchParams(() => {
                    // Start fresh from current search params
                    const newParams = new URLSearchParams(window.location.search);
                    newParams.set('view', defaultView);
                    return newParams;
                }, { replace: true });
            }
            filterInitialized.current = true;
        }
    }, [viewOptions, setSearchParams]);

    useEffect(() => {
        setTitle('Gestión de Tickets');
    }, [setTitle]);

    // ... (existing derivations)

    // Helper functions to update URL params (replace setters)
    const updateParams = useCallback((updates: Record<string, string | null>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null) {
                    newParams.delete(key);
                } else {
                    newParams.set(key, value);
                }
            });
            // Reset page on filter changes (heuristic: if 'page' is not explicitly set in updates, reset it)
            if (!('page' in updates)) {
                newParams.set('page', '1');
            }
            return newParams;
        });
    }, [setSearchParams]);

    const handleSort = (key: string) => {
        if (sortBy === key) {
            // Toggle order
            updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
        } else {
            // New key, default to desc (or asc based on type? usually asc for text, desc for date/id. Let's default asc)
            // Actually, for consistency let's default to asc except for date/id.
            // But simplify: Toggle.
            updateParams({ sortBy: key, sortOrder: 'asc' });
        }
    };

    // Specific Setters for UI Components (Clean defaults from URL)
    const setPage = (p: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(p));
            return newParams;
        });
    };

    const setViewFilter = (val: string) => updateParams({ view: val });
    const setStatusFilter = (val: string) => updateParams({ status: val === 'Todos' ? null : val });
    const setUserPriorityFilter = (val: string) => updateParams({ userPriority: val === 'Todas' ? null : val });
    const setSubcategoryPriorityFilter = (val: string) => updateParams({ subcategoryPriority: val === 'Todas' ? null : val });
    const setSearchQuery = (val: string) => updateParams({ search: val === '' ? null : val });

    const setAdvancedFilters = (newFilters: Partial<TicketFilter>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            // Clear old advanced filters first? Or merge?
            // Usually replace. To be safe, let's verify keys.
            const knownKeys = ['messageSearch', 'creatorId', 'assigneeId', 'companyId', 'subcategoryId', 'tagId', 'ticketId', 'dateFrom', 'dateTo'];
            knownKeys.forEach(k => newParams.delete(k));

            Object.entries(newFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    newParams.set(key, String(value));
                }
            });
            newParams.set('page', '1');
            return newParams;
        });
    };

    // ...

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
                sortBy,
                sortOrder,
                ...advancedFilters
            };

            const response = await ticketService.getTickets(params);
            setTickets(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [viewFilter, statusFilter, userPriorityFilter, subcategoryPriorityFilter, searchQuery, page, limit, advancedFilters, sortBy, sortOrder]);

    // Effect to fetch tickets when URL params change
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

    // ...

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
                }}
                onClear={() => {
                    setAdvancedFilters({});
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
                sort={{ key: sortBy, order: sortOrder }}
                onSort={handleSort}
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        className: 'px-6 py-4 font-mono font-medium text-gray-900',
                        render: (ticket: Ticket) => `#TK-${ticket.id}`,
                        sortable: true
                    },
                    {
                        key: 'subject',
                        header: 'Asunto',
                        render: (ticket: Ticket) => (
                            <div>
                                <p className="font-medium text-gray-900">{ticket.subject}</p>
                                <p className="text-xs text-gray-500">Ticket #{ticket.id}</p>
                            </div>
                        ),
                        sortable: true
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
                        ),
                        sortable: true
                    },
                    {
                        key: 'assignedTo',
                        header: 'Asignado a',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold bg-gray-100 text-gray-600`}>
                                    {getInitials(ticket.asignadoNombre || 'Sin Asignar')}
                                </div>
                                <span className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={ticket.asignadoNombre}>
                                    {ticket.asignadoNombre || 'Sin Asignar'}
                                </span>
                            </div>
                        )
                        // Assignee sorting is complex (list), skipping for now as per plan
                    },
                    {
                        key: 'status',
                        header: 'Estado',
                        render: (ticket: Ticket) => (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                        ),
                        sortable: true
                    },
                    {
                        key: 'priority',
                        header: 'Prioridad Usuario',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.priority).split(' ')[0]}`}></div>
                                <span className="font-medium text-gray-700">{ticket.priority}</span>
                            </div>
                        ),
                        sortable: true
                    },
                    {
                        key: 'prioritySubcategory',
                        header: 'Prioridad Flujo',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.prioritySubcategory || 'Media').split(' ')[0]}`}></div>
                                <span className="font-medium text-gray-700">{ticket.prioritySubcategory || 'Media'}</span>
                            </div>
                        ),
                        sortable: true
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
                        render: (ticket: Ticket) => {
                            if (!ticket.lastUpdated) return <span className="text-gray-500">-</span>;
                            const date = new Date(ticket.lastUpdated);
                            const formattedDate = date.toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                            const formattedTime = date.toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });
                            return (
                                <div className="text-gray-500">
                                    <div>{formattedDate}</div>
                                    <div className="text-xs text-gray-400">{formattedTime}</div>
                                </div>
                            );
                        },
                        sortable: true
                    },
                    {
                        key: 'actions',
                        header: 'Acciones',
                        className: 'px-6 py-4 text-right',
                        render: (ticket: Ticket) => (
                            <div className="flex justify-end gap-2">
                                {/* Botón Reabrir (Solo si cerrado y permiso) */}
                                {ticket.status === 'Cerrado' && can('reopen', 'Ticket') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTicketToReopen(ticket.id);
                                            setIsReopenModalOpen(true);
                                        }}
                                        className="rounded p-1 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600"
                                        title="Reabrir Ticket"
                                    >
                                        <span className="material-symbols-outlined">restart_alt</span>
                                    </button>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/tickets/${ticket.id}`);
                                    }}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-blue"
                                >
                                    <span className="material-symbols-outlined">visibility</span>
                                </button>
                            </div>
                        )
                    }
                ]}
            />

            {ticketToReopen && (
                <ReopenTicketModal
                    isOpen={isReopenModalOpen}
                    onClose={() => setIsReopenModalOpen(false)}
                    ticketId={ticketToReopen}
                    onSuccess={fetchTickets}
                />
            )}

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
