
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-background-dark/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div
                className={cn(
                    "relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200",
                    className
                )}
            >
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}
