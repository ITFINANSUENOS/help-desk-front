import type { TicketDetail } from '../interfaces/Ticket';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { MermaidGraph } from './MermaidGraph';
import { Icon } from '../../../shared/components/Icon';

interface TicketWorkflowProps {
    ticket: TicketDetail;
}

export function TicketWorkflow({ ticket }: TicketWorkflowProps) {
    const activeStepName = ticket.workflowStep || 'Procesamiento';

    // Verify "Fecha de terminacion" exists
    let terminacionField = ticket.campoValores?.find(
        (cv) => {
            const name = (cv.campoNombre || '').toLowerCase();
            return name.includes('terminacion') || name.includes('terminación');
        }
    );

    // If no exact match for "terminacion", fallback to the first date field for demonstration, 
    // or log the fields to help the user identify the exact name.
    console.log("Valores de plantilla del ticket recibidos:", ticket.campoValores);

    if (!terminacionField) {
        // Fallback to the first field of type 'date' just in case it's named something else entirely
        terminacionField = ticket.campoValores?.find(cv => cv.campoTipo === 'date');
    }

    let daysPassedInfo = null;
    if (terminacionField && terminacionField.valor) {
        // Try parsing assuming the value is something like YYYY-MM-DD
        const terminacionDate = new Date(terminacionField.valor + 'T00:00:00'); // Add time to avoid timezone drops if it's just date
        // Fallback or override if it's already a full ISO string
        const parsedDate = isNaN(terminacionDate.getTime()) ? new Date(terminacionField.valor) : terminacionDate;

        if (!isNaN(parsedDate.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const targetDate = new Date(parsedDate);
            targetDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - targetDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let colorClass = 'text-gray-600';
            let bgClass = 'bg-gray-50 border-gray-100';
            let iconValue = 'event';
            let sign = '';

            if (diffDays > 0) {
                colorClass = 'text-orange-700';
                bgClass = 'bg-orange-50 border-orange-200';
                iconValue = 'warning';
                sign = `Han pasado ${diffDays} día(s)`;
            } else if (diffDays < 0) {
                colorClass = 'text-emerald-700';
                bgClass = 'bg-emerald-50 border-emerald-200';
                iconValue = 'schedule';
                sign = `Faltan ${Math.abs(diffDays)} día(s)`;
            } else {
                colorClass = 'text-blue-700';
                bgClass = 'bg-blue-50 border-blue-200';
                iconValue = 'today';
                sign = 'Termina hoy';
            }

            daysPassedInfo = (
                <div className={`mb-6 rounded-lg p-3 border flex items-center gap-3 ${bgClass} ${colorClass}`}>
                    <Icon name={iconValue} className="text-xl" />
                    <div>
                        <span className="font-bold block text-sm">{terminacionField.campoNombre}: {targetDate.toLocaleDateString()}</span>
                        <span className="text-sm font-medium">{sign} en relación a la fecha límite indicada.</span>
                    </div>
                </div>
            );
        }
    }


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

            {daysPassedInfo}

            <div className="mt-8 rounded-lg bg-sky-50 p-4 border border-sky-100 print:mt-0 print:bg-transparent print:border-0 print:p-0">
                <h4 className="text-sm font-bold text-brand-accent mb-1 print:text-black">Paso Actual: {activeStepName}</h4>
                <div className="text-sm text-gray-600">
                    <span className="font-bold">Descripción de la Tarea:</span>
                    {ticket.description ? (
                        <>
                            {/* Screen View: Editor */}
                            <div className="react-quill-readonly mt-1 p-0 border-0 bg-transparent print:hidden">
                                <RichTextEditor
                                    value={ticket.description}
                                    onChange={() => { }} // Read-only
                                    disabled={true}
                                    height={350}
                                />
                            </div>
                            {/* Print View: Raw HTML to avoid iframe cutoff */}
                            <div
                                className="hidden print:block mt-2 text-sm [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-gray-300 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2"
                                dangerouslySetInnerHTML={{ __html: ticket.description }}
                            />
                        </>
                    ) : (
                        ' No hay descripción disponible para este paso.'
                    )}
                </div>
            </div>
        </div>
    );
}
