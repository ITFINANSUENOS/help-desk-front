import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

/**
 * Props para el componente FormModal
 */
export interface FormModalProps {
    /** Si el modal está abierto */
    isOpen: boolean;
    /** Callback al cerrar el modal */
    onClose: () => void;
    /** Título del modal */
    title: string;
    /** Contenido del formulario */
    children: ReactNode;
    /** Callback al enviar el formulario */
    onSubmit: (e: React.FormEvent) => void;
    /** Texto del botón de envío */
    submitText?: string;
    /** Texto del botón de cancelación */
    cancelText?: string;
    /** Si está procesando el envío */
    loading?: boolean;
    /** Tamaño del modal */
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal genérico para formularios
 * 
 * Proporciona una estructura consistente para modales de creación/edición.
 * 
 * @example
 * ```tsx
 * <FormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSubmit={handleSubmit}
 *   title="Crear Departamento"
 *   submitText="Crear"
 * >
 *   <Input label="Nombre" {...} />
 * </FormModal>
 * ```
 */
export function FormModal({
    isOpen,
    onClose,
    title,
    children,
    onSubmit,
    submitText = 'Guardar',
    cancelText = 'Cancelar',
    loading = false,
    size = 'md'
}: FormModalProps) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className={sizeClasses[size]}
        >
            <form onSubmit={handleSubmit}>
                <div className="max-h-[calc(100vh-16rem)] overflow-y-auto -mr-2 pr-2">
                    {children}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="outline"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        variant="brand"
                    >
                        {loading ? 'Guardando...' : submitText}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
