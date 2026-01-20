
import { cn } from '../../lib/utils';

// Mock Data matching the design
const recentTickets = [
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
        <div className="mt-8 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <h3 className="text-lg font-bold text-gray-800">Recent Active Tickets</h3>
                <a className="text-sm font-bold text-brand-teal hover:text-brand-accent" href="#">View All</a>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recentTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-gray-900">{ticket.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{ticket.subject}</td>
                                <td className="px-6 py-4">{ticket.customer}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", ticket.statusColor)}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={cn("flex items-center gap-1.5", ticket.priorityColor)}>
                                        <div className={cn("h-2 w-2 rounded-full", ticket.priorityDot)}></div>
                                        <span className="font-medium">{ticket.priority}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-brand-blue transition-colors">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
