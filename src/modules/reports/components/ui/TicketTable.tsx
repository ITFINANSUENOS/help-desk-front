import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { CategoryPath } from './CategoryPath';
import { formatFecha } from '../../utils/formatters';
import type { TicketListItem } from '../../types/dashboard.types';

interface TicketTableProps {
    tickets: TicketListItem[];
    emptyMessage?: string;
}

export function TicketTable({ tickets, emptyMessage = 'Sin datos' }: TicketTableProps) {
    if (tickets.length === 0) {
        return (
            <div className="py-8 text-center text-gray-400 text-sm italic">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                        <th className="py-3 px-4">Ticket</th>
                        <th className="py-3 px-4">Título</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-right">Fecha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-blue-50 transition-colors">
                            <td className="py-3 px-4">
                                <Link
                                    to={`/tickets/${ticket.id}`}
                                    className="text-brand-teal hover:underline font-medium"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    #{ticket.id}
                                </Link>
                            </td>
                            <td className="py-3 px-4 text-gray-700 max-w-[200px] truncate" title={ticket.titulo}>
                                {ticket.titulo}
                            </td>
                            <td className="py-3 px-4">
                                <StatusBadge estado={ticket.estado} />
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                                <CategoryPath categoria={ticket.categoria} subcategoria={ticket.subcategoria} />
                            </td>
                            <td className="py-3 px-4 text-right text-gray-500 text-xs">
                                {formatFecha(ticket.fechaCreacion)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}