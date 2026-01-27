import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticket.service';
import type { TicketDetail, TicketTimelineItem, TicketStatus, TicketPriority } from '../interfaces/Ticket';
import { Button } from '../../../shared/components/Button';
import { TicketWorkflow } from '../components/TicketWorkflow';
import { TicketTimeline } from '../components/TicketTimeline';
import { EditTicketModal } from '../components/EditTicketModal';
import { TicketResponsePanel } from '../components/TicketResponsePanel';
import { useLayout } from '../../../core/layout/context/LayoutContext';

export default function TicketDetailPage() {
    const { setTitle } = useLayout();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [timeline, setTimeline] = useState<TicketTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'comments' | 'history' | 'document'>('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        setTitle('Gestión de Tickets');
    }, [setTitle]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [ticketData, timelineData] = await Promise.all([
                ticketService.getTicket(Number(id)),
                ticketService.getTicketTimeline(Number(id))
            ]);
            setTicket(ticketData);
            setTimeline(timelineData);
        } catch (error) {
            console.error("Error fetching ticket details:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeFilter === 'document' && ticket && !pdfUrl) {
            ticketService.getTicketMasterPdf(ticket.id)
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                })
                .catch(err => console.error("Error loading PDF", err));
        }
    }, [activeFilter, ticket, pdfUrl]);

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'Abierto': return 'bg-cyan-50 text-brand-teal ring-brand-teal/20';
            case 'Pausado': return 'bg-blue-50 text-brand-accent ring-brand-accent/20';
            case 'Cerrado': return 'bg-gray-100 text-gray-600 ring-gray-600/20';
            default: return 'bg-gray-100 text-gray-600 ring-gray-600/20';
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'Alta': return 'bg-red-50 text-brand-red ring-brand-red/20';
            case 'Media': return 'bg-orange-50 text-orange-600 ring-orange-600/20';
            case 'Baja': return 'bg-green-50 text-green-600 ring-green-600/20';
            default: return 'bg-gray-50 text-gray-600 ring-gray-600/20';
        }
    };

    const filteredItems = timeline.filter(item => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'comments') return item.type === 'comment';
        if (activeFilter === 'history') return item.type !== 'comment';
        return true;
    });

    // Logic to resolve the effective "Assigned To" name
    // Because the main endpoint might return "Usuario (ID: 123)" if relation is missing,
    // we look at the timeline history for the latest assignment event to get the real name.
    const getEffectiveAssignedToName = () => {
        if (!ticket) return '';

        // If we already have a good name (not unknown/generic), use it.
        if (ticket.assignedTo &&
            !ticket.assignedTo.includes('Unknown') &&
            !ticket.assignedTo.includes('Usuario (ID:')) {
            return ticket.assignedTo;
        }

        // Otherwise, look in timeline for the assignedToId
        if (ticket.assignedToId) {
            // Find the latest 'assignment' or 'creation' event where asignadoA matches the current ID
            // Timeline is usually sorted new->old or old->new. Let's find any match.
            const match = timeline.find(t => t.asignadoA?.id === ticket.assignedToId);
            if (match?.asignadoA?.nombre) {
                return match.asignadoA.nombre;
            }
        }

        return ticket.assignedTo || 'Sin Asignar';
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-gray-500">Cargando detalle del ticket...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-500">El ticket solicitado no pudo ser encontrado.</p>
                <Button variant="secondary" onClick={() => navigate('/tickets')}>
                    Volver a Tickets
                </Button>
            </div>
        );
    }

    const effectiveAssignedToName = getEffectiveAssignedToName();

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="!p-0 text-gray-400 hover:text-gray-600" onClick={() => navigate('/tickets')}>
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </Button>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Ticket #{ticket.id} - {ticket.subject}
                        </h2>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500 pl-9">
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            Creado: {new Date(ticket.createdDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            Cliente: {ticket.customer}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">folder</span>
                            Categoría: {ticket.category}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary">
                        <span className="material-symbols-outlined mr-2">print</span>
                        Imprimir
                    </Button>
                    <Button variant="brand" onClick={() => setIsEditModalOpen(true)}>
                        <span className="material-symbols-outlined mr-2">edit</span>
                        Editar Ticket
                    </Button>
                </div>
            </div>

            <TicketWorkflow ticket={ticket} />

            <TicketResponsePanel
                ticketId={ticket.id}
                assignedToId={ticket.assignedToId}
                assignedToName={effectiveAssignedToName}
                creatorId={ticket.creatorId}
                creatorName={ticket.creatorName}
                onSuccess={fetchData}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveFilter('document')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeFilter === 'document'
                                    ? 'border border-gray-200 bg-white text-gray-900 shadow-sm'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                    Documento
                                </span>
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <button
                                type="button"
                                onClick={() => setActiveFilter('all')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeFilter === 'all'
                                    ? 'border border-gray-200 bg-white text-gray-900 shadow-sm'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Toda la Actividad
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFilter('comments')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeFilter === 'comments'
                                    ? 'border border-gray-200 bg-white text-gray-900 shadow-sm'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Comentarios
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFilter('history')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeFilter === 'history'
                                    ? 'border border-gray-200 bg-white text-gray-900 shadow-sm'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Historial
                            </button>
                        </div>
                    </div>

                    {activeFilter === 'document' ? (
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px]">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-[800px]"
                                    title="Vista Previa del Documento"
                                />
                            ) : (
                                <div className="flex h-64 items-center justify-center">
                                    <p className="text-gray-500">Cargando documento...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <TicketTimeline items={filteredItems} />
                    )}
                </div>
            </div>

            <EditTicketModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchData}
                ticket={ticket}
            />
        </>
    );
}
