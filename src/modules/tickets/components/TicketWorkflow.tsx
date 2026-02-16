import type { TicketDetail } from '../interfaces/Ticket';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { MermaidGraph } from './MermaidGraph';

interface TicketWorkflowProps {
    ticket: TicketDetail;
}

export function TicketWorkflow({ ticket }: TicketWorkflowProps) {
    const activeStepName = ticket.workflowStep || 'Procesamiento';

    return (
        <div className="mb-8 rounded-xl border border-brand-accent/20 bg-white p-6 shadow-sm print:border-0 print:shadow-none print:p-0 print:mb-4">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-500 no-print">Progreso del Flujo</h3>

            <div className="relative mb-6 no-print">
                {ticket.subcategoryId ? (
                    <MermaidGraph
                        ticketId={ticket.id}
                    />
                ) : (
                    <div className="text-sm text-gray-400 italic">Este ticket no tiene un flujo asociado.</div>
                )}
            </div>

            <div className="mt-8 rounded-lg bg-sky-50 p-4 border border-sky-100 print:mt-0 print:bg-transparent print:border-0 print:p-0">
                <h4 className="text-sm font-bold text-brand-accent mb-1 print:text-black">Paso Actual: {activeStepName}</h4>
                <div className="text-sm text-gray-600">
                    <span className="font-bold">Descripción de la Tarea:</span>
                    {ticket.description ? (
                        <div className="react-quill-readonly mt-1 p-0 border-0 bg-transparent">
                            <RichTextEditor
                                value={ticket.description}
                                onChange={() => { }} // Read-only
                                disabled={true}
                                height={150}
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
