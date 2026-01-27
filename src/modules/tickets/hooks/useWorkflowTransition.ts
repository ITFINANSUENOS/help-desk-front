import { useState, useCallback } from 'react';
import { ticketService } from '../services/ticket.service';
import type { CheckNextStepResponse } from '../interfaces/Ticket';
import { toast } from 'sonner';

export interface WorkflowTransitionState {
    isLoading: boolean;
    data: CheckNextStepResponse | null;
    modalOpen: boolean;
}

export function useWorkflowTransition(ticketId: number) {
    const [state, setState] = useState<WorkflowTransitionState>({
        isLoading: false,
        data: null,
        modalOpen: false
    });

    const checkTransition = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const result = await ticketService.checkNextStep(ticketId);

            // Logic to determine if we need to open modal
            let shouldOpenModal = false;

            if (result.transitionType === 'decision') {
                shouldOpenModal = true;
            } else if (result.transitionType === 'linear') {
                // Always open modal to show "Next Step" info and allow verification
                shouldOpenModal = true;
            } else if (result.transitionType === 'parallel_pending') {
                toast.warning('Hay tareas paralelas pendientes. No se puede avanzar.');
                shouldOpenModal = false;
            }

            setState({
                isLoading: false,
                data: result,
                modalOpen: shouldOpenModal
            });

            return {
                shouldOpenModal,
                data: result
            };

        } catch (error) {
            console.error('Error checking next step:', error);
            toast.error('Error al verificar el siguiente paso del flujo.');
            setState(prev => ({ ...prev, isLoading: false }));
            return null;
        }
    }, [ticketId]);

    const closeModal = useCallback(() => {
        setState(prev => ({ ...prev, modalOpen: false }));
    }, []);

    return {
        ...state,
        checkTransition,
        closeModal
    };
}
