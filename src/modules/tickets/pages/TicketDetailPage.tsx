import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticket.service';
import type { TicketDetail, TicketTimelineItem, TicketStatus, TicketPriority, ParallelTask } from '../interfaces/Ticket';
import { stepService } from '../../workflows/services/step.service';
import type { StepAttachment } from '../components/TicketResponsePanel';
import { Button } from '../../../shared/components/Button';
import { TicketWorkflow } from '../components/TicketWorkflow';
import { TicketTimeline } from '../components/TicketTimeline';
import { TicketAttachmentsPanel } from '../components/TicketAttachmentsPanel';
import { EditTicketModal } from '../components/EditTicketModal';
import { TicketResponsePanel } from '../components/TicketResponsePanel';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import TagManagementModal from '../components/TagManagementModal';
import { Icon } from '../../../shared/components/Icon';
import { useAuth } from '../../auth/context/useAuth';
import { ReassignTicketModal } from '../components/ReassignTicketModal';
import { toast } from 'sonner';

export default function TicketDetailPage() {
    const { setTitle } = useLayout();
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [timeline, setTimeline] = useState<TicketTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'comments' | 'history' | 'document'>('comments');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [parallelTasks, setParallelTasks] = useState<ParallelTask[]>([]);
    const [stepAttachments, setStepAttachments] = useState<StepAttachment[]>([]);
    const [reassignLoading, setReassignLoading] = useState(false);
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

            // Load step attachments if ticket has a workflowStepId
            const pasoId = ticketData.workflowStepId;
            if (pasoId) {
                try {
                    const attachments = await stepService.getStepAttachments(pasoId);
                    setStepAttachments(attachments);
                } catch (err) {
                    console.error('Error loading step attachments:', err);
                    setStepAttachments([]);
                }
            }
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
        // Always exclude creation items from the timeline — shown in the attachments panel
        if (item.type === 'creation') return false;
        if (activeFilter === 'all') return true;
        if (activeFilter === 'comments') return item.type === 'comment';
        if (activeFilter === 'history') return item.type !== 'comment';
        return true;
    });

    // Extract creation attachments from the timeline to show in the dedicated panel.
    // Filter out intermediate signature files (parallel_signature_*, signature_*) which are
    // system-generated and should never appear as user-visible attachments.
    const SIGNATURE_PREFIXES = ['parallel_signature_', 'signature_'];
    const creationAttachments = timeline
        .filter(item => item.type === 'creation')
        .flatMap(item => item.metadata?.attachments || [])
        .filter((att: { nombre: string }) =>
            !SIGNATURE_PREFIXES.some(prefix => att.nombre?.startsWith(prefix))
        );

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
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Volver a Tickets
                </Button>
            </div>
        );
    }

    const effectiveAssignedToName = getEffectiveAssignedToName();

    // handleCloseTicket moved to TicketResponsePanel

    const handlePrint = () => {
        window.print();
    };

    const handleOpenReassignModal = async () => {
        if (ticket?.isParallelStep) {
            try {
                const tasks = await ticketService.getParallelTasks(ticket.id);
                setParallelTasks(tasks);
            } catch (error) {
                console.error("Error fetching parallel tasks:", error);
                toast.error("Error al cargar tareas paralelas");
                return;
            }
        }
        setIsReassignModalOpen(true);
    };

    const handleReassign = async (data: {
        nuevoUsuarioId: number;
        tipoAsignacion: 'principal' | 'paralelo';
        paraleloId?: number;
        comentario?: string;
        crearNuevoParalelo?: boolean;
    }) => {
        if (!ticket) return;
        try {
            setReassignLoading(true);
            await ticketService.reassignTicket(ticket.id, data);
            toast.success("Operación realizada exitosamente");
            setIsReassignModalOpen(false);
            fetchData(); // Refresh ticket data
        } catch (error) {
            console.error("Error reassigning ticket:", error);
            toast.error("Error al reasignar el ticket");
        } finally {
            setReassignLoading(false);
        }
    };

    // Check if user has reassign permission
    const canReassign = user?.permissions?.some(
        (p) => p.action === 'reassign' && p.subject === 'Ticket'
    );

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start print:mb-2 text-black">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button variant="ghost" className="!p-0 text-gray-400 hover:text-gray-600 no-print" onClick={() => navigate(-1)}>
                            <Icon name="arrow_back" className="text-xl" />
                        </Button>
                        <h2 className="text-2xl font-bold text-gray-900 print:text-black">
                            Ticket #{ticket.id} - {ticket.subject}
                        </h2>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                        </span>
                        {/* Current tags display */}
                        {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap no-print">
                                {ticket.tags.map(tag => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style={{ backgroundColor: tag.color + '18', color: tag.color, border: `1px solid ${tag.color}30` }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500 pl-9">
                        <span className="flex items-center gap-1.5">
                            <Icon name="calendar_today" className="text-[18px]" />
                            Creado: {new Date(ticket.createdDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Icon name="person" className="text-[18px]" />
                            Cliente: {ticket.customer}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Icon name="folder" className="text-[18px]" />
                            Categoría: {ticket.category}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3 no-print">
                    <Button variant="secondary" onClick={handlePrint}>
                        <Icon name="print" className="mr-2" />
                        Imprimir
                    </Button>
                    {canReassign && (
                        <Button variant="secondary" onClick={handleOpenReassignModal}>
                            <Icon name="swap_horiz" className="mr-2" />
                            Reasignar
                        </Button>
                    )}
                    {(
                        (ticket && user && (
                            Number(user.id) === Number(ticket.assignedToId) ||
                            (ticket.assignedToIds && ticket.assignedToIds.includes(Number(user.id)))
                        ))
                    ) && (
                            <Button variant="secondary" onClick={() => setIsTagModalOpen(true)}>
                                <Icon name="label" className="mr-2" />
                                Etiquetas
                            </Button>
                        )}
                </div>
            </div>

            {/* Workflow Section */}
            <div>
                <TicketWorkflow ticket={ticket} />
            </div>

            {/* Ticket Creation Attachments Panel */}
            <div className="mb-4">
                <TicketAttachmentsPanel attachments={creationAttachments} />
            </div>

            {/* Step Attachments - Templates for this step */}
            {stepAttachments.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="folder_open" className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">Plantillas / Archivos del Paso</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {stepAttachments.map(attachment => (
                            <button
                                key={attachment.id}
                                type="button"
                                onClick={() => {
                                    const pasoId = ticket.workflowStepId;
                                    toast.info(`Descargando: paso=${pasoId}, attachment=${attachment.id}`);
                                    ticketService.downloadFile(`/workflows/steps/${pasoId}/attachments/${attachment.id}/download`, attachment.nombreOriginal);
                                }}
                                className="flex items-center gap-2 p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors w-full text-left"
                            >
                                <Icon name="description" className="text-blue-600 text-lg" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{attachment.nombreOriginal}</p>
                                    <p className="text-xs text-gray-500">{(attachment.tamano / 1024).toFixed(1)} KB</p>
                                </div>
                                <Icon name="download" className="text-blue-500 text-lg" />
                            </button>
                        ))}
                    </div>
                </div>
            )}


            {/* Main Content Grid - Remove grid for print to allow natural flow */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 print:block print:gap-0">
                <div className="lg:col-span-3 space-y-6 print:space-y-4">
                    <div className="flex items-center justify-between no-print">
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
                                    <Icon name="picture_as_pdf" className="text-[16px]" />
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
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px] no-print">
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
                        <div className="no-print">
                            <TicketTimeline items={filteredItems} />
                        </div>
                    )}

                    {/* Print Only: Always show full timeline */}
                    <div className="hidden print:block pt-4">
                        <h3 className="text-xl font-bold mb-4 text-black border-b border-gray-300 pb-2">Historial Completo</h3>
                        <div className="print:block print:overflow-visible">
                            <TicketTimeline items={timeline} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 no-print">
                <TicketResponsePanel
                    ticketId={ticket.id}
                    assignedToId={ticket.assignedToId}
                    assignedToIds={ticket.assignedToIds}
                    assignedToName={effectiveAssignedToName}

                    onSuccess={fetchData}
                    isParallelStep={ticket.isParallelStep}
                    stepRequiresSignature={ticket.stepRequiresSignature}
                    status={ticket.status}
                    isForcedClose={ticket.isForcedClose}
                    allowsClosing={ticket.allowsClosing}
                    stepDescription={ticket.stepDescription}
                />
            </div>

            <EditTicketModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchData}
                ticket={ticket}
                className="no-print"
            />

            <TagManagementModal
                isOpen={isTagModalOpen}
                onClose={() => setIsTagModalOpen(false)}
                ticketId={ticket.id}
                currentTags={ticket.tags}
                onTagAssigned={fetchData}
            />

            <ReassignTicketModal
                isOpen={isReassignModalOpen}
                onClose={() => setIsReassignModalOpen(false)}
                onConfirm={handleReassign}
                isLoading={reassignLoading}
                isParallelStep={ticket.isParallelStep || false}
                currentAssignee={effectiveAssignedToName}
                parallelTasks={parallelTasks}
            />
        </>
    );
}
