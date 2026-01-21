import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../core/layout/DashboardLayout';
import { ticketService } from '../services/ticket.service';
import type { Ticket, TicketStatus, TicketPriority } from '../interfaces/Ticket';
import { Button } from '../../../shared/components/Button';
import { CreateTicketModal } from '../components/CreateTicketModal';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { DataTable } from '../../../shared/components/DataTable';

export default function TicketsPage() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All Statuses'>('All Statuses');
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All Priorities'>('All Priorities');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ticketService.getTickets({
                view: 'all',
                status: statusFilter,
                priority: priorityFilter,
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
    }, [statusFilter, priorityFilter, searchQuery, page, limit]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, priorityFilter, searchQuery]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchTickets]);

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'Abierto': return 'bg-cyan-50 text-brand-teal';
            case 'Pausado': return 'bg-blue-50 text-brand-accent';
            case 'Cerrado': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'Alta': return 'bg-brand-red';
            case 'Media': return 'bg-orange-400';
            case 'Baja': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-indigo-100 text-indigo-600', 'bg-yellow-100 text-yellow-700',
            'bg-pink-100 text-pink-600', 'bg-blue-100 text-blue-600',
            'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700',
            'bg-red-100 text-brand-red', 'bg-cyan-100 text-brand-teal'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const filterConfig: FilterConfig[] = [
        {
            type: 'search',
            name: 'search',
            placeholder: 'Search by ID, subject, or customer...',
            value: searchQuery,
            onChange: (val) => setSearchQuery(val as string)
        },
        {
            type: 'select',
            name: 'status',
            value: statusFilter,
            onChange: (val) => setStatusFilter(val as any),
            options: [
                { label: 'All Statuses', value: 'All Statuses' },
                { label: 'Abierto', value: 'Abierto' },
                { label: 'Pausado', value: 'Pausado' },
                { label: 'Cerrado', value: 'Cerrado' }
            ]
        },
        {
            type: 'select',
            name: 'priority',
            value: priorityFilter,
            onChange: (val) => setPriorityFilter(val as any),
            options: [
                { label: 'All Priorities', value: 'All Priorities' },
                { label: 'Alta', value: 'Alta' },
                { label: 'Media', value: 'Media' },
                { label: 'Baja', value: 'Baja' }
            ]
        }
    ];

    return (
        <DashboardLayout title="Tickets">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Tickets</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage support requests and track their progress.</p>
                </div>
                <Button variant="brand" className="shadow-sm" onClick={() => setIsCreateModalOpen(true)}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Create Ticket
                </Button>
            </div>

            <CreateTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchTickets}
            />

            <FilterBar filters={filterConfig} className="mb-6" />

            <DataTable<Ticket>
                data={tickets}
                loading={loading}
                emptyMessage="No tickets found matching your filters."
                loadingMessage="Loading tickets..."
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
                        header: 'Subject',
                        render: (ticket: Ticket) => (
                            <div>
                                <p className="font-medium text-gray-900">{ticket.subject}</p>
                                <p className="text-xs text-gray-500">Ticket #{ticket.id}</p>
                            </div>
                        )
                    },
                    {
                        key: 'customer',
                        header: 'Customer',
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
                        header: 'Status',
                        render: (ticket: Ticket) => (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                        )
                    },
                    {
                        key: 'priority',
                        header: 'Priority',
                        render: (ticket: Ticket) => (
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.priority).split(' ')[0]}`}></div>
                                <span className="font-medium text-gray-700">{ticket.priority}</span>
                            </div>
                        )
                    },
                    {
                        key: 'lastUpdated',
                        header: 'Last Updated',
                        render: (ticket: Ticket) => <span className="text-gray-500">{ticket.lastUpdated}</span>
                    },
                    {
                        key: 'actions',
                        header: 'Action',
                        className: 'px-6 py-4 text-right',
                        render: () => (
                            <div className="flex justify-end">
                                <button
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-blue"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Add dropdown menu logic
                                    }}
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        )
                    }
                ]}
            />
        </DashboardLayout>
    );
}
