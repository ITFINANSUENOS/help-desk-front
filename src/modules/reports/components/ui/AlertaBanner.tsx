import { IconX } from '@tabler/icons-react';
import { twMerge } from 'tailwind-merge';

interface AlertaBannerProps {
    type: 'info' | 'warning' | 'critico';
    message: string;
    onClose?: () => void;
    className?: string;
}

export const AlertaBanner = ({ type, message, onClose, className }: AlertaBannerProps) => {
    const isCritical = type === 'critico';
    const isWarning = type === 'warning';

    return (
        <div className={twMerge(
            "w-full px-4 py-3 flex items-center justify-between rounded-md mb-4 shadow-sm",
            isCritical ? "bg-[#D92323] text-white" : isWarning ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-100 text-blue-900",
            className
        )}>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                    {isCritical ? '⚠️ CRÍTICO:' : isWarning ? '⚠️ ATENCIÓN:' : 'ℹ️ INFO:'}
                </span>
                <span className="text-sm">{message}</span>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className={twMerge(
                        "p-1 rounded-md transition-colors",
                        isCritical ? "hover:bg-red-700 text-red-100 hover:text-white" : isWarning ? "hover:bg-amber-200 text-amber-700" : "hover:bg-blue-200 text-blue-700"
                    )}
                >
                    <IconX size={18} />
                </button>
            )}
        </div>
    );
};
