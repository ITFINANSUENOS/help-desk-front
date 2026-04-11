import type { ReactNode } from 'react';

interface ReportHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
}

export function ReportHeader({ title, subtitle, icon, actions, children }: ReportHeaderProps) {
    return (
        <div className="flex flex-col gap-4 px-6 py-5 lg:px-8 border-b border-gray-100 bg-white/60 backdrop-blur-xl z-20 shrink-0 sticky top-0">
            {/* Title Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {icon && (
                        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm border border-blue-100">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className="hidden sm:block">{actions}</div>}
            </div>

            {/* Filters Row */}
            {children && (
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
                    <div className="flex flex-wrap gap-3 items-end w-full">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}
