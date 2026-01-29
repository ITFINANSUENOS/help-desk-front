import type { TicketDetail } from '../interfaces/Ticket';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.bubble.css';
import { WorkflowGraph } from './WorkflowGraph';

interface TicketWorkflowProps {
    ticket: TicketDetail;
}

export function TicketWorkflow({ ticket }: TicketWorkflowProps) {
    const activeStepName = ticket.workflowStep || 'Procesamiento';

    return (
        <div className="mb-8 rounded-xl border border-brand-accent/20 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-500">Progreso del Flujo</h3>

            <div className="relative mb-6">
                {ticket.subcategoryId ? (
                    <WorkflowGraph
                        subcategoryId={ticket.subcategoryId}
                        currentStepId={ticket.workflowStepId}
                    />
                ) : (
                    <div className="text-sm text-gray-400 italic">Este ticket no tiene un flujo asociado.</div>
                )}
            </div>

            <div className="mt-8 rounded-lg bg-sky-50 p-4 border border-sky-100">
                <h4 className="text-sm font-bold text-brand-accent mb-1">Paso Actual: {activeStepName}</h4>
                <div className="text-sm text-gray-600">
                    <span className="font-bold">Descripción de la Tarea:</span>
                    {ticket.description ? (
                        <div className="react-quill-readonly mt-1 p-0 border-0 bg-transparent">
                            <ReactQuill
                                value={ticket.description}
                                readOnly={true}
                                theme="bubble"
                                modules={{ toolbar: false }}
                            />
                        </div>
                    ) : (
                        ' No hay descripción disponible para este paso.'
                    )}
                </div>
            </div>
        </div>
    );
}
