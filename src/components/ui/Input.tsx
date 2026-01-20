import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente Input.
 * @property {string} [label] - Texto opcional para la etiqueta superior.
 * @property {string} [icon] - Nombre del ícono de Material Symbols a mostrar a la derecha.
 * @property {() => void} [onIconClick] - Manejador de eventos para clic en el ícono.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string; // Material symbol name
    onIconClick?: () => void;
}

/**
 * Componente Input de formulario.
 * Incluye soporte para etiquetas, íconos y estilos de enfoque personalizados.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, icon, onIconClick, id, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2">
                {label && (
                    <label htmlFor={id} className="text-[#121617] text-sm font-semibold">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={type}
                        className={cn(
                            "form-input block w-full rounded-lg border border-gray-200 bg-slate-50 p-3 text-base text-[#121617] placeholder:text-gray-400 focus:border-brand-teal focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal h-12 transition-all hover:bg-slate-100",
                            className
                        )}
                        ref={ref}
                        id={id}
                        {...props}
                    />
                    {icon && (
                        <button
                            type="button"
                            onClick={onIconClick}
                            className={cn(
                                "material-symbols-outlined absolute right-3 top-3 text-gray-400 select-none transition-colors hover:text-brand-teal",
                                onIconClick ? "cursor-pointer pointer-events-auto" : "pointer-events-none"
                            )}
                            style={{ fontSize: '20px' }}
                        >
                            {icon}
                        </button>
                    )}
                </div>
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
