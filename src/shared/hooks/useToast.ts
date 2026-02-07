import { useState, useCallback, useRef } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    ticketId?: number;
}

let toastCounter = 0;

/**
 * Hook for managing toast notifications.
 * Provides methods to show and remove toasts.
 */
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const callbacksRef = useRef<Record<string, () => void>>({});

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        // Execute callback if exists
        if (callbacksRef.current[id]) {
            callbacksRef.current[id]();
            delete callbacksRef.current[id];
        }
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>, onDismiss?: () => void) => {
        const id = `toast-${Date.now()}-${toastCounter++}`;
        const newToast: Toast = {
            id,
            ...toast,
            duration: toast.duration ?? 5000, // Default 5 seconds
        };

        if (onDismiss) {
            callbacksRef.current[id] = onDismiss;
        }

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }
    }, [removeToast]);

    return {
        toasts,
        showToast,
        removeToast,
    };
}
