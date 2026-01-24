import type { TicketDetail } from '../interfaces/Ticket';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.bubble.css';

interface TicketWorkflowProps {
    ticket: TicketDetail;
}

export function TicketWorkflow({ ticket }: TicketWorkflowProps) {
    // This is a simplified view. Ideally, we should fetch the full workflow definition.
    // For now, we mock steps based on common status progression.
    const steps = [
        { id: 1, name: 'Solicitud Creada', status: 'completed' },
        { id: 2, name: 'Triaje', status: 'completed' },
        { id: 3, name: 'Procesamiento', status: ticket.status === 'Pausado' ? 'current' : (ticket.status === 'Cerrado' ? 'completed' : 'pending') },
        { id: 4, name: 'Resolución', status: ticket.status === 'Cerrado' ? 'completed' : 'pending' },
        { id: 5, name: 'Cierre', status: ticket.status === 'Cerrado' ? 'completed' : 'pending' },
    ];

    // Override active step based on API field if available
    const activeStepName = ticket.workflowStep || 'Procesamiento';

    return (
        <div className="mb-8 rounded-xl border border-brand-accent/20 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-500">Progreso del Flujo</h3>
            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-gray-100 rounded-full"></div>

                {/* Active Progress Bar (Mocked width based on status) */}
                <div
                    className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-brand-accent rounded-full transition-all duration-500"
                    style={{ width: `${(steps.findIndex(s => s.status === 'current') + 1) / steps.length * 100}%` }}
                ></div>

                <div className="relative flex justify-between">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md ring-4 ring-white z-10 transition-colors
                                ${step.status === 'completed' ? 'bg-brand-accent text-white' :
                                    step.status === 'current' ? 'border-2 border-brand-accent bg-white text-brand-accent' :
                                        'border-2 border-gray-200 bg-white text-gray-400'}`}>
                                {step.status === 'completed' ? (
                                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                                ) : (
                                    <span className="text-xs font-bold">{index + 1}</span>
                                )}
                            </div>
                            <span className={`text-xs font-semibold ${step.status === 'completed' || step.status === 'current' ? 'text-brand-accent' : 'text-gray-400'
                                }`}>
                                {step.name}
                            </span>
                        </div>
                    ))}
                </div>
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
