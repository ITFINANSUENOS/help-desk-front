
import { cn } from '../../../shared/lib/utils';
import { DataTable } from '../../../shared/components/DataTable';

interface MockTicket {
    id: string;
    subject: string;
    customer: string;
    status: string;
    priority: string;
    statusColor: string;
    priorityColor: string;
    priorityDot: string;
}

// Mock Data matching the design
const recentTickets: MockTicket[] = [
    {
        id: "#TK-2049",
        subject: "Login authentication failure",
        customer: "Michael Scott",
        status: "Open",
        priority: "High",
        statusColor: "bg-cyan-50 text-brand-teal",
        priorityColor: "text-brand-red",
        priorityDot: "bg-brand-red"
    },
    {
        id: "#TK-2048",
        subject: "Billing invoice mismatch",
        customer: "Dwight Schrute",
        status: "In Progress",
        priority: "Medium",
        statusColor: "bg-blue-50 text-brand-accent",
        priorityColor: "text-orange-500",
        priorityDot: "bg-orange-500"
    },
    {
        id: "#TK-2047",
        subject: "Update account preferences",
        customer: "Pam Beesly",
        status: "Open",
        priority: "Low",
        statusColor: "bg-cyan-50 text-brand-teal",
        priorityColor: "text-green-600",
        priorityDot: "bg-green-600"
    },
    {
        id: "#TK-2046",
        subject: "Cannot access reports module",
        customer: "Jim Halpert",
        status: "In Progress",
        priority: "High",
        statusColor: "bg-blue-50 text-brand-accent",
        priorityColor: "text-brand-red",
        priorityDot: "bg-brand-red"
    }
];

export function TicketTable() {
    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-800">Recent Active Tickets</h3>
                <a className="text-sm font-bold text-brand-teal hover:text-brand-accent" href="#">View All</a>
            </div>
            <DataTable<MockTicket>
                data={recentTickets}
                getRowKey={(ticket) => ticket.id}
                columns={[
                    {
                        key: 'id',
                        header: 'ID',
                        className: 'px-6 py-4 font-mono font-medium text-gray-900',
                    },
                    {
                        key: 'subject',
                        header: 'Subject',
                        className: 'px-6 py-4 font-medium text-gray-800'
                    },
                    {
                        key: 'customer',
                        header: 'Customer'
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        render: (ticket: MockTicket) => (
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", ticket.statusColor)}>
                                {ticket.status}
                            </span>
                        )
                    },
                    {
                        key: 'priority',
                        header: 'Priority',
                        render: (ticket: MockTicket) => (
                            <div className={cn("flex items-center gap-1.5", ticket.priorityColor)}>
                                <div className={cn("h-2 w-2 rounded-full", ticket.priorityDot)}></div>
                                <span className="font-medium">{ticket.priority}</span>
                            </div>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'Action',
                        className: 'px-6 py-4 text-right',
                        render: () => (
                            <div className="flex justify-end">
                                <button className="text-gray-400 hover:text-brand-blue transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
}
