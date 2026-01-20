import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string; // Material symbol name
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, icon, id, ...props }, ref) => {
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
                            "form-input block w-full rounded-lg border border-gray-200 bg-white p-3 text-base text-[#121617] placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal h-12 transition-all",
                            className
                        )}
                        ref={ref}
                        id={id}
                        {...props}
                    />
                    {icon && (
                        <span
                            className="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none select-none"
                            style={{ fontSize: '20px' }}
                        >
                            {icon}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
