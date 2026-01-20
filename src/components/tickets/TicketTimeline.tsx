import type { TicketTimelineItem } from '../../interfaces/Ticket';

interface TicketTimelineProps {
    items: TicketTimelineItem[];
}

export function TicketTimeline({ items }: TicketTimelineProps) {
    return (
        <div className="relative space-y-8 pl-4 before:absolute before:inset-0 before:left-[27px] before:h-full before:w-0.5 before:bg-gray-200">
            {items.map((item, index) => (
                <div key={item.id || index} className="relative flex gap-6">
                    {/* Avatar / Icon */}
                    <div className="absolute left-0 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#f6f8f8] bg-white">
                        {item.type === 'comment' ? (
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
                    <div className={`ml-12 w-full rounded-xl border bg-white p-5 shadow-sm 
                        ${item.type === 'status_change' ? 'border-l-4 border-gray-200 border-l-brand-teal p-4' : 'border-gray-200'}`}>

                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <span className="font-bold text-gray-900">{item.author}</span>
                                {item.authorRole && (
                                    <span className="ml-2 text-xs text-brand-accent font-medium bg-blue-50 px-2 py-0.5 rounded">
                                        {item.authorRole}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</span>
                        </div>

                        {item.type === 'status_change' ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-900">
                                    Estado actualizado a <span className="text-brand-teal">{item.metadata?.newStatus || 'Desconocido'}</span>
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {item.content}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
