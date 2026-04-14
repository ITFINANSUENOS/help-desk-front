import type { ReactNode } from 'react';
import { ScoreBadge } from './ScoreBadge';
import { ClasificacionDot } from './ClasificacionDot';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface Column<T> {
    header: string;
    accessor: keyof T | string;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: T) => ReactNode;
}

interface ReportTableProps<T extends Record<string, unknown>> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    stickyHeader?: boolean;
    rowKey?: keyof T;
}

const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};

export function ReportTable<T extends Record<string, unknown>>({
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = 'No hay datos para mostrar.',
    stickyHeader = false,
    rowKey = 'id' as keyof T,
}: ReportTableProps<T>) {
    const getValue = (row: T, accessor: keyof T | string): unknown => {
        if (typeof accessor === 'string' && accessor.includes('.')) {
            return accessor.split('.').reduce((obj, key) => (obj as Record<string, unknown>)?.[key], row as unknown);
        }
        return row[accessor];
    };

    if (isLoading) {
        return (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <LoadingSkeleton rows={8} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`py-3 px-4 ${alignClasses[col.align || 'left']}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-gray-500 text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr
                                    key={String(row[rowKey])}
                                    onClick={() => onRowClick?.(row)}
                                    className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                                >
                                    {columns.map((col, colIdx) => {
                                        const value = getValue(row, col.accessor);
                                        return (
                                            <td
                                                key={colIdx}
                                                className={`py-3 px-4 text-sm ${alignClasses[col.align || 'left']}`}
                                            >
                                                {col.render ? col.render(value, row) : renderDefaultValue(value)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function renderDefaultValue(value: unknown): ReactNode {
    if (value === null || value === undefined) {
        return <span className="text-gray-400">-</span>;
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'boolean') {
        return value ? 'Sí' : 'No';
    }
    return String(value);
}
