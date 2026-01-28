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
import type { ParallelTask } from '../interfaces/Ticket';
import { ErrorEventsPanel } from './ErrorEventsPanel';

interface TicketResponsePanelProps {
    ticketId: number;
    assignedToId?: number;
    assignedToIds?: number[]; // Support parallel assignees
    assignedToName?: string;
    creatorId: number; // Required for checking permissions
    creatorName: string;
    onSuccess: () => void;
    templateFields?: TemplateField[];
    isParallelStep?: boolean; // NEW: Indicates if current step is parallel
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
    isParallelStep = false
}) => {
    const { user } = useAuth();
    const [comment, setComment] = useState('');
    const [dynamicValues, setDynamicValues] = useState<{ campoId: number; valor: string }[]>([]);

    // DEBUG: Check isParallelStep value
    console.log('🔍 TicketResponsePanel - isParallelStep:', isParallelStep, 'ticketId:', ticketId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Signature State
    const [signature, setSignature] = useState<string | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // Parallel Modal State
    const [isParallelModalOpen, setIsParallelModalOpen] = useState(false);

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

            await ticketService.transitionTicket(dto);

            toast.success('Ticket actualizado correctamente');
            setComment('');
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
                {isParallelStep ? 'Tarea Paralela Asignada' : 'Responder / Avanzar Flujo'}
            </h3>

            {/* DYNAMIC FORM AREA */}
            {templateFields.length > 0 && (
                <DynamicStepForm
                    fields={templateFields}
                    onChange={setDynamicValues}
                />
            )}

            {/* Error Events Panel - Embedded */}
            {(isExplicitlyAssigned || isInAssignedList) && (
                <ErrorEventsPanel ticketId={ticketId} onSuccess={onSuccess} />
            )}

            {/* EDITOR AREA - Hidden for Parallel Step as it uses Modal */}
            {!isParallelStep && (
                <div className="mb-4 space-y-3">
                    <ReactQuill
                        theme="snow"
                        value={comment}
                        onChange={setComment}
                        placeholder="Escriba su respuesta o notas internas..."
                        className="bg-white"
                    />

                    {/* Signature Preview or Button */}
                    {signature ? (
                        <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                                <span className="text-xs text-gray-500 font-medium block mb-1">Firma Adjunta:</span>
                                <img src={signature} alt="Firma" className="h-16 border bg-white rounded object-contain p-1" />
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setSignature(null)}>
                                <span className="material-symbols-outlined">delete</span>
                            </Button>
                        </div>
                    ) : (
                        <Button variant="secondary" size="sm" onClick={() => setIsSignatureModalOpen(true)}>
                            <span className="material-symbols-outlined text-sm mr-2">ink_pen</span>
                            Agregar Firma
                        </Button>
                    )}
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

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3">
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
                ) : (
                    <Button
                        variant="brand"
                        onClick={handleMainAction}
                        disabled={isChecking || isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : (isChecking ? 'Verificando...' : 'Enviar y Avanzar')}
                    </Button>
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
        </div>
    );
};
