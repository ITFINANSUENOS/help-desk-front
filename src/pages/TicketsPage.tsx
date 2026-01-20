import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { ticketService } from '../services/ticket.service';
import type { Ticket, TicketStatus, TicketPriority } from '../interfaces/Ticket';
import { Button } from '../components/ui/Button';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All Statuses'>('All Statuses');
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All Priorities'>('All Priorities');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ticketService.getTickets({
                view: 'all', // TODO: Make this dynamic if needed
                status: statusFilter,
                priority: priorityFilter,
                search: searchQuery,
            });
            setTickets(response.data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, priorityFilter, searchQuery]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTickets();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [fetchTickets]);

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'Open': return 'bg-cyan-50 text-brand-teal';
            case 'In Progress': return 'bg-blue-50 text-brand-accent';
            case 'Resolved': return 'bg-green-50 text-green-600';
            case 'Closed': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'High': return 'bg-brand-red';
            case 'Medium': return 'bg-orange-400';
            case 'Low': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    // Helper to get initials (e.g. "Michael Scott" -> "MS")
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Helper to get distinct background color for avatar based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-indigo-100 text-indigo-600',
            'bg-yellow-100 text-yellow-700',
            'bg-pink-100 text-pink-600',
            'bg-blue-100 text-blue-600',
            'bg-green-100 text-green-700',
            'bg-purple-100 text-purple-700',
            'bg-red-100 text-brand-red',
            'bg-cyan-100 text-brand-teal'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

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

            {/* Filter Bar */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-md">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="material-symbols-outlined text-gray-400">search</span>
                        </div>
                        <input
                            className="block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-brand-teal focus:bg-white focus:ring-brand-teal"
                            placeholder="Search by ID, subject, or customer..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <select
                                className="appearance-none rounded-lg border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-brand-teal focus:ring-brand-teal"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All Statuses')}
                            >
                                <option>All Statuses</option>
                                <option>Open</option>
                                <option>In Progress</option>
                                <option>Resolved</option>
                                <option>Closed</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none rounded-lg border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-brand-teal focus:ring-brand-teal"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'All Priorities')}
                            >
                                <option>All Priorities</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <button className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 hover:border-brand-teal hover:text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2">
                            <span className="material-symbols-outlined">filter_list</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Last Updated</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Loading tickets...
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No tickets found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-gray-900">#TK-{ticket.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{ticket.subject}</p>
                                            <p className="text-xs text-gray-500">Ticket #{ticket.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(ticket.customer)}`}>
                                                    {ticket.customerInitials || getInitials(ticket.customer)}
                                                </div>
                                                <span className="font-medium text-gray-900">{ticket.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2.5 w-2.5 rounded-full ${getPriorityColor(ticket.priority).split(' ')[0]}`}></div>
                                                <span className="font-medium text-gray-700">{ticket.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{ticket.lastUpdated}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-blue">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Mocked for now) */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                    <div className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{tickets.length > 0 ? 1 : 0}</span> to <span className="font-medium text-gray-900">{tickets.length}</span> of <span className="font-medium text-gray-900">{tickets.length}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
