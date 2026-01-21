import type { ReactNode } from "react";

export interface ColumnDef<T> {
    key: string;
    header: string;
    className?: string;
    render?: (item: T) => ReactNode;
}

export interface PaginationInfo {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    loadingMessage?: string;
    pagination?: PaginationInfo;
    onRowClick?: (item: T) => void;
    getRowKey: (item: T) => string | number;
}

export function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No se encontraron resultados.',
    loadingMessage = 'Cargando...',
    pagination,
    onRowClick,
    getRowKey
}: DataTableProps<T>) {
    const colSpan = columns.length;

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={col.className || 'px-6 py-4'}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-500">
                                    {loadingMessage}
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={getRowKey(item)}
                                    className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : 'hover:bg-gray-50'}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={col.className || 'px-6 py-4'}>
                                            {col.render ? col.render(item) : (item as any)[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && !loading && data.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <div className="text-sm text-gray-500">
                        Mostrando{' '}
                        <span className="font-medium text-gray-900">
                            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        a{' '}
                        <span className="font-medium text-gray-900">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        de{' '}
                        <span className="font-medium text-gray-900">{pagination.total}</span> resultados
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            Anterior
                        </button>
                        <button
                            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
