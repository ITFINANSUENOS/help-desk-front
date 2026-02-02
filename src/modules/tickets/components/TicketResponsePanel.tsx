import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '../../../shared/components/Button';
import { useWorkflowTransition } from '../hooks/useWorkflowTransition';
import { WorkflowDecisionModal } from './WorkflowDecisionModal';
import { DynamicStepForm } from './DynamicStepForm';
import { SignatureModal } from './SignatureModal';
import { ticketService } from '../services/ticket.service';
import type { TransitionTicketDto, TemplateField } from '../interfaces/Ticket';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/useAuth';

import { ParallelSignatureModal } from './ParallelSignatureModal';
import { Modal } from '../../../shared/components/Modal';
import type { ParallelTask, TicketStatus } from '../interfaces/Ticket'; // Added TicketStatus
import { ErrorEventsPanel } from './ErrorEventsPanel';
import { CreateNoveltyModal } from './CreateNoveltyModal';
import { ResolveNoveltyModal } from './ResolveNoveltyModal';
import { FileUploader } from '../../../shared/components/FileUploader';

interface TicketResponsePanelProps {
    ticketId: number;
    assignedToId?: number;
    assignedToIds?: number[]; // Support parallel assignees
    assignedToName?: string;
    creatorId: number; // Required for checking permissions
    creatorName: string;
    onSuccess: () => void;
    templateFields?: TemplateField[];
    isParallelStep?: boolean;
    status: TicketStatus; // Added status prop
}

export const TicketResponsePanel: React.FC<TicketResponsePanelProps> = ({
    ticketId,
    assignedToId,
    assignedToIds,
    assignedToName,
    creatorId,
    creatorName,
    onSuccess,
    templateFields = [],
    isParallelStep = false,
    status
}) => {
    const { user } = useAuth();
    const [comment, setComment] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [dynamicValues, setDynamicValues] = useState<{ campoId: number; valor: string }[]>([]);

    const isPaused = status === 'Pausado';
    const isClosed = status === 'Cerrado';

    // DEBUG: Check isParallelStep value
    console.log('🔍 TicketResponsePanel - isParallelStep:', isParallelStep, 'ticketId:', ticketId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Signature State
    const [signature, setSignature] = useState<string | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // Parallel Modal State
    const [isParallelModalOpen, setIsParallelModalOpen] = useState(false);

    // Novelty Modal State
    const [isCreateNoveltyModalOpen, setIsCreateNoveltyModalOpen] = useState(false);
    const [isResolveNoveltyModalOpen, setIsResolveNoveltyModalOpen] = useState(false);

    // Close Confirmation Modal State
    const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);

    // Parallel Task State
    const [parallelTasks, setParallelTasks] = React.useState<ParallelTask[]>([]);

    // Fetch parallel tasks if applicable
    React.useEffect(() => {
        if (isParallelStep && ticketId) {
            ticketService.getParallelTasks(ticketId)
                .then(setParallelTasks)
                .catch(err => console.error('Failed to fetch parallel tasks', err));
        }
    }, [ticketId, isParallelStep]);

    const myParallelTask = parallelTasks.find(t => Number(t.usuarioId) === Number(user?.id));
    const hasSigned = myParallelTask?.estado === 'Completado';
    const isPending = myParallelTask?.estado === 'Pendiente';

    // Permission Logic
    const isExplicitlyAssigned = Number(user?.id) === Number(assignedToId);
    const isInAssignedList = assignedToIds ? assignedToIds.includes(Number(user?.id)) : false;
    const isCreator = Number(user?.id) === Number(creatorId);

    const canInteract = isExplicitlyAssigned || isInAssignedList || isCreator;

    // Hook logic
    const {
        data: transitionData,
        modalOpen,
        checkTransition,
        closeModal,
        isLoading: isChecking
    } = useWorkflowTransition(ticketId);

    // Check for Final Step on Mount
    React.useEffect(() => {
        if (!isParallelStep && !isPaused && !isClosed && !transitionData && !isChecking) {
            checkTransition(true); // Silent check
        }
    }, [ticketId, isParallelStep, isPaused, isClosed]);

    const isFinalStep = transitionData?.transitionType === 'final';

    const [filesForClose, setFilesForClose] = useState<File[]>([]);

    // Handler: Open Close Modal
    const handleCloseTicket = () => {
        setIsCloseConfirmationOpen(true);
    };

    // Handler: Confirm Close
    const handleConfirmClose = async () => {
        const cleanComment = comment.replace(/<[^>]*>/g, '').trim();
        if (!cleanComment) {
            toast.warning('Por favor escriba una nota de cierre.');
            return;
        }

        setIsSubmitting(true);
        try {
            await ticketService.closeTicket(ticketId, comment, filesForClose);
            toast.success('Ticket cerrado exitosamente (Ciclo Finalizado)');
            setComment('');
            setFilesForClose([]);
            setIsCloseConfirmationOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al cerrar el ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for "Enviar" / "Avanzar" click
    const handleMainAction = async () => {
        const cleanComment = comment.replace(/<[^>]*>/g, '').trim();
        if (!cleanComment) {
            toast.warning('Por favor escriba un comentario o respuesta.');
            return;
        }
        await checkTransition();
    };


    // Handler: Confirm Signature
    const handleSignatureConfirm = (base64: string) => {
        setSignature(base64);
        toast.success('Firma capturada correctamente');
    };

    // Handler when Modal confirms decision/user
    const handleTransitionConfirm = async (transitionKeyOrStepId: string, targetUserId?: number, manualAssignments?: Record<string, number>) => {
        setIsSubmitting(true);
        try {
            const dto: TransitionTicketDto = {
                ticketId,
                transitionKeyOrStepId,
                comentario: comment,
                targetUserId,
                manualAssignments,
                templateValues: dynamicValues.length > 0 ? dynamicValues : undefined,
                signature: signature || undefined
            };

            await ticketService.transitionTicket(dto, files);

            toast.success('Ticket actualizado correctamente');
            setComment('');
            setFiles([]);
            setDynamicValues([]);
            setSignature(null);
            closeModal();
            onSuccess();

        } catch (error) {
            console.error(error);
            toast.error('Error al procesar la transición');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler: Sign Parallel Task
    const handleSignParallelTask = async (signatureBase64: string, modalComment: string) => {
        if (!modalComment.trim()) {
            // Optional check logic if comment is mandatory
        }

        setIsSubmitting(true);
        try {
            const result = await ticketService.signParallelTask({
                ticketId,
                comentario: modalComment,
                signature: signatureBase64
            });

            if (result.autoAdvanced) {
                toast.success('Firma registrada. Todas las firmas completadas. Ticket avanzado automáticamente.');
            } else {
                toast.success('Firma registrada correctamente. Esperando firmas pendientes.');
            }

            setComment('');
            setSignature(null);
            setIsParallelModalOpen(false); // Close modal
            onSuccess();

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al firmar la tarea paralela');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler: Create Novelty
    const handleCreateNovelty = async (data: { usuarioAsignadoId: number; descripcion: string }, files: File[]) => {
        setIsSubmitting(true);
        try {
            await ticketService.createNovelty(ticketId, data, files);
            toast.success('Novedad creada. El ticket ha sido pausado.');
            setIsCreateNoveltyModalOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear la novedad');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveNovelty = async (files: File[]) => {
        setIsSubmitting(true);
        try {
            await ticketService.resolveNovelty(ticketId, files);
            toast.success('Novedad resuelta. El ticket ha sido reanudado.');
            setIsResolveNoveltyModalOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al resolver la novedad');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isClosed) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <span className="material-symbols-outlined text-gray-500 text-2xl">lock_clock</span>
                </div>
                <h3 className="text-gray-900 font-semibold mb-1">Ticket Cerrado</h3>
                <p className="text-gray-500 text-sm max-w-md">
                    Este ticket se encuentra cerrado. No se pueden realizar más acciones sobre él.
                </p>
            </div>
        );
    }

    if (!canInteract) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <span className="material-symbols-outlined text-gray-500 text-2xl">lock</span>
                </div>
                <h3 className="text-gray-900 font-semibold mb-1">Modo de Solo Lectura</h3>
                <p className="text-gray-500 text-sm max-w-md">
                    Solo el usuario asignado ({assignedToName || 'Sin asignar'}) o el creador ({creatorName}) pueden responder o avanzar el flujo en este momento.
                </p>
                <div className="mt-4 text-xs text-brand-teal font-medium bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                    Tú eres: {user?.nombre} {user?.apellido}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {isParallelStep ? 'Tarea Paralela Asignada' : (isFinalStep ? 'Finalizar Ticket' : 'Responder / Avanzar Flujo')}
            </h3>

            {/* DYNAMIC FORM AREA - Hide on Final Step? User said "desapareeria description" but meant generic fields? 
                Usually Final Step has no fields, but if it did, we might want to hide them. 
                User said: "desapareeria cuando sea el ultimpo paso del ticket la descripcion".
                Assuming dynamic form is fine if empty.
            */}
            {!isFinalStep && templateFields.length > 0 && (
                <DynamicStepForm
                    fields={templateFields}
                    onChange={setDynamicValues}
                />
            )}

            {/* Error Events Panel - Embedded */}
            {(isExplicitlyAssigned || isInAssignedList) && (
                <ErrorEventsPanel ticketId={ticketId} onSuccess={onSuccess} />
            )}

            {/* EDITOR AREA */}
            {!isParallelStep && !isPaused && (
                <div className="mb-4 space-y-3">
                    <ReactQuill
                        theme="snow"
                        value={comment}
                        onChange={setComment}
                        placeholder={isFinalStep ? "Escriba la nota de cierre y conclusiones..." : "Escriba su respuesta o notas internas..."}
                        className="bg-white"
                    />




                    <FileUploader
                        files={files}
                        onFilesChange={setFiles}
                        label="Adjuntos (Opcional)"
                        maxFiles={5}
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                </div>
            )}

            {/* Parallel info message */}
            {isParallelStep && (
                <div className={`border rounded-lg p-4 mb-4 ${hasSigned ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>

                    <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined mt-0.5 ${hasSigned ? 'text-green-600' : 'text-blue-600'}`}>
                            {hasSigned ? 'check_circle' : 'info'}
                        </span>
                        <div>
                            <p className={`text-sm font-medium ${hasSigned ? 'text-green-800' : 'text-blue-800'}`}>
                                {hasSigned ? 'Ya has firmado tu parte.' : 'Este es un paso de aprobación paralela.'}
                            </p>
                            <p className={`text-sm mt-1 ${hasSigned ? 'text-green-600' : 'text-blue-600'}`}>
                                {hasSigned
                                    ? 'Estamos esperando a que los demás participantes completen sus firmas.'
                                    : 'Debes firmar tu parte para que el ticket pueda avanzar.'}
                            </p>

                            {/* Summary of signatures */}
                            <div className="mt-3 text-xs bg-white bg-opacity-60 p-2 rounded">
                                <p className="font-semibold mb-1 text-gray-700">Progreso de Firmas:</p>
                                <ul className="space-y-1">
                                    {parallelTasks.map(task => (
                                        <li key={task.id} className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${task.estado === 'Completado' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span className="text-gray-600">
                                                {task.usuario?.nombre || 'Usuario'}
                                                {Number(task.usuarioId) === Number(user?.id) && ' (Tú)'}
                                            </span>
                                            <span className="text-gray-400 italic">- {task.estado}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Paused Banner */}
            {isPaused && (
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-orange-600 mt-0.5">pause_circle</span>
                        <div>
                            <p className="text-sm font-medium text-orange-800">
                                Ticket Pausado (Novedad Abierta)
                            </p>
                            <p className="text-sm mt-1 text-orange-600">
                                Se ha registrado una novedad que impide continuar con el flujo normal.
                                Debe resolver la novedad para reanudar el ticket.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3">
                {isPaused ? (
                    <Button
                        variant="brand"
                        onClick={() => setIsResolveNoveltyModalOpen(true)}
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isSubmitting ? 'Procesando...' : 'Resolver Novedad (Reanudar)'}
                    </Button>
                ) : (
                    <>
                        {/* Show "Crear Novedad" if not parallel step and active */}
                        {!isParallelStep && (
                            <Button
                                variant="secondary"
                                onClick={() => setIsCreateNoveltyModalOpen(true)}
                                disabled={isSubmitting || isChecking}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                            >
                                <span className="material-symbols-outlined text-sm mr-2">pause_circle</span>
                                Crear Novedad
                            </Button>
                        )}

                        {isParallelStep ? (
                            <Button
                                variant="brand"
                                onClick={() => setIsParallelModalOpen(true)}
                                disabled={isChecking || isSubmitting || hasSigned || !isPending}
                            >
                                {hasSigned
                                    ? 'Firma Completada'
                                    : (isSubmitting ? 'Procesando...' : 'Firmar mi parte')}
                            </Button>
                        ) : isFinalStep ? (
                            <Button
                                variant="brand"
                                onClick={handleCloseTicket}
                                disabled={isChecking || isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                            >
                                <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
                                {isSubmitting ? 'Cerrando...' : 'Finalizar Ticket & Cerrar'}
                            </Button>
                        ) : (
                            <Button
                                variant="brand"
                                onClick={handleMainAction}
                                disabled={isChecking || isSubmitting}
                            >
                                {isSubmitting ? 'Procesando...' : (isChecking ? 'Verificando...' : 'Enviar y Avanzar')}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* MODALS */}
            <WorkflowDecisionModal
                open={modalOpen}
                onOpenChange={(v) => !v && closeModal()}
                transitionData={transitionData}
                onConfirm={handleTransitionConfirm}
                isLoading={isSubmitting}
                isAssignedUser={isExplicitlyAssigned || isInAssignedList}
            />

            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onConfirm={handleSignatureConfirm}
            />

            <ParallelSignatureModal
                isOpen={isParallelModalOpen}
                onClose={() => setIsParallelModalOpen(false)}
                onConfirm={handleSignParallelTask}
                isLoading={isSubmitting}
            />

            <CreateNoveltyModal
                isOpen={isCreateNoveltyModalOpen}
                onClose={() => setIsCreateNoveltyModalOpen(false)}
                onConfirm={handleCreateNovelty}
                isLoading={isSubmitting}
            />

            <ResolveNoveltyModal
                isOpen={isResolveNoveltyModalOpen}
                onClose={() => setIsResolveNoveltyModalOpen(false)}
                onConfirm={handleResolveNovelty}
                isLoading={isSubmitting}
            />

            {/* Close Confirmation Modal */}
            <Modal
                isOpen={isCloseConfirmationOpen}
                onClose={() => setIsCloseConfirmationOpen(false)}
                title="Finalizar y Cerrar Ticket"
                className="max-w-md"
            >
                <div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 flex gap-3">
                        <span className="material-symbols-outlined text-yellow-600 mt-0.5">warning</span>
                        <div>
                            <p className="font-medium text-yellow-800 mb-1">Atención</p>
                            <p className="text-sm text-yellow-700">
                                Para finalizar el ticket, es <strong>obligatorio</strong> registrar una nota de cierre y conclusiones en el editor.
                                <br /><br />
                                ¿Está seguro de que desea cerrar este ticket definitivamente? Esta acción no se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <FileUploader
                            files={filesForClose}
                            onFilesChange={setFilesForClose}
                            label="Adjuntar Evidencias de Cierre (Opcional)"
                            maxFiles={5}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsCloseConfirmationOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="brand"
                            onClick={handleConfirmClose}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        >
                            {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
