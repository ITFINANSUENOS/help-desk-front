import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DateRange {
    dateFrom?: string;
    dateTo?: string;
}

interface FiltroFechaProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

export const FiltroFecha = ({ value, onChange, className }: FiltroFechaProps) => {
    const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, dateFrom: e.target.value || undefined });
    };

    const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, dateTo: e.target.value || undefined });
    };

    const handleClear = () => {
        onChange({ dateFrom: undefined, dateTo: undefined });
    };

    const hasValue = value.dateFrom || value.dateTo;

    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            <input
                type="date"
                value={value.dateFrom || ''}
                onChange={handleDateFromChange}
                className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-[#121617] focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal h-10"
                placeholder="Desde"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
                type="date"
                value={value.dateTo || ''}
                onChange={handleDateToChange}
                className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-[#121617] focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal h-10"
                placeholder="Hasta"
            />
            {hasValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-gray-400 hover:text-red-500 transition-colors h-10 px-2"
                    title="Limpiar fechas"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

// Hook para compartir el estado del filtro de fechas (sincronizado con URL)
export const useDateFilter = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const dateRange: DateRange = { dateFrom, dateTo };

    const setDateRange = (range: DateRange) => {
        const newParams = new URLSearchParams(searchParams);
        if (range.dateFrom) {
            newParams.set('dateFrom', range.dateFrom);
        } else {
            newParams.delete('dateFrom');
        }
        if (range.dateTo) {
            newParams.set('dateTo', range.dateTo);
        } else {
            newParams.delete('dateTo');
        }
        setSearchParams(newParams, { replace: true });
    };

    return { dateRange, setDateRange };
};
