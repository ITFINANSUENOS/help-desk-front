import { useNavigate } from 'react-router-dom';
import {
    IconCheck,
    IconCircleCheck,
    IconAlertCircle,
    IconMessageCircle,
    IconPlus,
    IconFileText,
    IconBell
} from '@tabler/icons-react';
import { type Notification } from '../../../shared/interfaces/notification.interface';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: number) => void;
}

export const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
    const navigate = useNavigate();
    const isUnread = notification.estado !== 1;

    const getNotificationType = (message: string): string => {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('asignado')) return 'assigned';
        if (lowerMsg.includes('cerrado') || lowerMsg.includes('resuelto')) return 'closed';
        if (lowerMsg.includes('vencido') || lowerMsg.includes('sla')) return 'overdue';
        if (lowerMsg.includes('comentario') || lowerMsg.includes('mensaje')) return 'comment';
        if (lowerMsg.includes('creado') || lowerMsg.includes('nuevo')) return 'created';
        return 'default';
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'closed':
                return {
                    icon: <IconCircleCheck className="w-6 h-6 text-green-600" />,
                    borderCtx: 'border-l-green-500',
                    bgCtx: 'bg-green-50',
                    textCtx: 'text-green-700'
                };
            case 'overdue':
                return {
                    icon: <IconAlertCircle className="w-6 h-6 text-red-600" />,
                    borderCtx: 'border-l-red-500',
                    bgCtx: 'bg-red-50',
                    textCtx: 'text-red-700'
                };
            case 'assigned':
                return {
                    icon: <IconFileText className="w-6 h-6 text-blue-600" />,
                    borderCtx: 'border-l-blue-500',
                    bgCtx: 'bg-blue-50',
                    textCtx: 'text-blue-700'
                };
            case 'comment':
                return {
                    icon: <IconMessageCircle className="w-6 h-6 text-orange-600" />,
                    borderCtx: 'border-l-orange-500',
                    bgCtx: 'bg-orange-50',
                    textCtx: 'text-orange-700'
                };
            case 'created':
                return {
                    icon: <IconPlus className="w-6 h-6 text-purple-600" />,
                    borderCtx: 'border-l-purple-500',
                    bgCtx: 'bg-purple-50',
                    textCtx: 'text-purple-700'
                };
            default:
                return {
                    icon: <IconBell className="w-6 h-6 text-gray-600" />,
                    borderCtx: 'border-l-gray-400',
                    bgCtx: 'bg-gray-50',
                    textCtx: 'text-gray-700'
                };
        }
    };

    const type = getNotificationType(notification.mensaje);
    const config = getTypeConfig(type);

    const handleClick = () => {
        if (notification.ticketId) {
            if (isUnread) {
                onMarkAsRead(notification.id);
            }
            navigate(`/tickets/${notification.ticketId}`);
        }
    };

    const formatTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            onClick={handleClick}
            className={`
                group relative flex items-start gap-5 p-5 rounded-xl border-l-[6px] transition-all duration-200 cursor-pointer shadow-sm
                ${config.borderCtx}
                ${isUnread
                    ? 'bg-blue-50/30 border-y border-r border-blue-100 hover:border-blue-200 hover:shadow-md'
                    : 'bg-white border-y border-r border-gray-100 hover:border-gray-200 hover:shadow-md'
                }
            `}
        >
            {/* Icon */}
            <div className={`mt-1 p-2.5 rounded-xl shrink-0 ${isUnread ? 'bg-white shadow-sm ring-1 ring-black/5' : 'bg-gray-50'}`}>
                {config.icon}
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto] gap-x-6 gap-y-2">

                {/* Left Content (Title & Message) */}
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className={`text-base ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {notification.ticketTitulo || "Notificación del Sistema"}
                        </p>
                        {notification.ticketId && (
                            <span className="inline-flex items-center rounded-md bg-gray-100/80 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                                #{notification.ticketId}
                            </span>
                        )}
                    </div>

                    <p className={`text-base mt-2 leading-relaxed ${isUnread ? 'text-gray-800' : 'text-gray-500'}`}>
                        {notification.mensaje}
                    </p>

                    {/* Badges/Tags Row */}
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`inline-flex items-center gap-1.5 rounded pr-2 py-0.5 text-xs font-bold uppercase tracking-wide ${config.textCtx}`}>
                            {/* Dot for tag */}
                            <span className={`w-1.5 h-1.5 rounded-full ${config.textCtx === 'text-green-700' ? 'bg-green-600' : config.textCtx === 'text-red-700' ? 'bg-red-600' : config.textCtx === 'text-blue-700' ? 'bg-blue-600' : config.textCtx === 'text-purple-700' ? 'bg-purple-600' : config.textCtx === 'text-orange-700' ? 'bg-orange-600' : 'bg-gray-500'}`}></span>
                            {type}
                        </span>
                    </div>
                </div>

                {/* Right Content (Date & Actions) */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:pl-4 sm:border-l sm:border-gray-50">
                    <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        {formatTime(notification.fechaNotificacion)}
                    </span>

                    <div className="flex items-center gap-3 mt-1">
                        {isUnread && (
                            <span
                                className="w-2.5 h-2.5 rounded-full bg-brand-blue shadow-sm ring-2 ring-blue-50"
                                title="No leída"
                            ></span>
                        )}

                        {/* Mark read button */}
                        {isUnread && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification.id);
                                }}
                                className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Marcar como leída"
                            >
                                <IconCheck className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
