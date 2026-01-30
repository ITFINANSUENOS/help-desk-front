import type { TicketTimelineItem } from '../interfaces/Ticket';
import DOMPurify from 'dompurify';

interface TicketTimelineProps {
    items: TicketTimelineItem[];
}

export function TicketTimeline({ items }: TicketTimelineProps) {
    return (
        <div className="relative space-y-8 pl-4 before:absolute before:inset-0 before:left-[27px] before:h-full before:w-0.5 before:bg-gray-200">
            {items.map((item, index) => {
                const isError = item.type === 'error_report' || !!item.metadata?.error;

                return (
                    <div key={item.id || index} className="relative flex gap-6">
                        {/* Avatar / Icon */}
                        <div className="absolute left-0 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#f6f8f8] bg-white">
                            {isError ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <span className="material-symbols-outlined text-xl">report_problem</span>
                                </div>
                            ) : item.type === 'comment' ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand-blue font-bold">
                                    {item.authorAvatar || 'U'}
                                </div>
                            ) : item.type === 'status_change' ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                                    <span className="material-symbols-outlined text-xl">cached</span>
                                </div>
                            ) : item.type === 'assignment' ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                    <span className="material-symbols-outlined text-xl">person_add</span>
                                </div>
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                                    <span className="material-symbols-outlined text-xl">info</span>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className={`ml-12 w-full rounded-xl border p-5 shadow-sm 
                            ${isError
                                ? 'border-l-4 border-l-red-500 border-red-100 bg-red-50'
                                : item.type === 'status_change'
                                    ? 'border-l-4 border-gray-200 border-l-brand-teal bg-white p-4'
                                    : 'border-gray-200 bg-white'}`}>

                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <span className={`font-bold ${isError ? 'text-red-900' : 'text-gray-900'}`}>{item.author}</span>
                                    {item.authorRole && (
                                        <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-brand-accent'}`}>
                                            {item.authorRole}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-xs ${isError ? 'text-red-400' : 'text-gray-400'}`}>{new Date(item.date).toLocaleString()}</span>
                            </div>

                            {isError && item.metadata?.error ? (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
                                        <div>
                                            <h4 className="font-bold text-red-800 text-sm uppercase tracking-wide mb-1">
                                                {item.metadata.error.title}
                                            </h4>
                                            <p className="text-red-700 text-sm">
                                                {item.metadata.error.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Show assignment context if it was an assignment that failed */}
                                    {item.type === 'assignment' && item.asignadoA && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 bg-white/50 border border-red-100 p-2 rounded-lg w-fit">
                                            <span className="material-symbols-outlined text-[18px]">person_off</span>
                                            <span>Responsable: <strong>{item.asignadoA.nombre}</strong></span>
                                        </div>
                                    )}
                                </div>
                            ) : item.type === 'status_change' ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-900">
                                        Estado actualizado a <span className="text-brand-teal">{item.metadata?.newStatus || 'Desconocido'}</span>
                                    </span>
                                </div>
                            ) : item.type === 'assignment' ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-900 font-medium">
                                        {item.content}
                                    </p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {item.asignadoA && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 w-fit">
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                                <span>Asignado a: <strong>{item.asignadoA.nombre}</strong></span>
                                            </div>
                                        )}
                                        {/* SLA Status Badge */}
                                        {item.metadata?.estadoTiempoPaso && (
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${['Atrasado', 'Vencido'].includes(item.metadata.estadoTiempoPaso)
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {['Atrasado', 'Vencido'].includes(item.metadata.estadoTiempoPaso) ? 'warning' : 'check_circle'}
                                                </span>
                                                {item.metadata.estadoTiempoPaso}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="text-sm text-gray-600 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                                />
                            )}

                            {item.metadata?.attachments && item.metadata.attachments.length > 0 && (
                                <div className={`mt-4 border-t pt-3 ${isError ? 'border-red-200' : 'border-gray-100'}`}>
                                    <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isError ? 'text-red-500' : 'text-gray-500'}`}>Adjuntos</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {item.metadata.attachments.map((att) => (
                                            <a
                                                key={att.id}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:shadow-sm
                                                    ${isError
                                                        ? 'border-red-200 bg-red-100 text-red-700 hover:bg-red-50 hover:text-red-900'
                                                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-white hover:text-brand-blue'}`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">description</span>
                                                {att.nombre}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
