import { IconX } from '@tabler/icons-react';
import { twMerge } from 'tailwind-merge';

interface AlertaBannerProps {
    nivel: 'critico' | 'warning';
    mensaje: string;
    onClose: () => void;
    className?: string;
}

export const AlertaBanner = ({ nivel, mensaje, onClose, className }: AlertaBannerProps) => {
    const isCritical = nivel === 'critico';

    return (
        <div className={twMerge(
            "w-full px-4 py-3 flex items-center justify-between rounded-md mb-4 shadow-sm",
            isCritical ? "bg-[#D92323] text-white" : "bg-yellow-100 text-yellow-800",
            className
        )}>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                    {isCritical ? '⚠️ CRÍTICO:' : 'ℹ️ ATENCIÓN:'}
                </span>
                <span className="text-sm">{mensaje}</span>
            </div>
            <button
                onClick={onClose}
                className={twMerge(
                    "p-1 rounded-md transition-colors",
                    isCritical ? "hover:bg-red-700 text-red-100 hover:text-white" : "hover:bg-yellow-200 text-yellow-700"
                )}
            >
                <IconX size={18} />
            </button>
        </div>
    );
};
