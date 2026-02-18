import { type ReactNode, useEffect, useRef, useState } from "react";

export interface ColumnDef<T> {
    key: string;
    header: string;
    className?: string;
    render?: (item: T) => ReactNode;
    sortable?: boolean;
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
    className?: string; // Add className prop
    sort?: { key: string; order: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;
}

export function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No se encontraron resultados.',
    loadingMessage = 'Cargando...',
    pagination,
    onRowClick,
    getRowKey,
    className = '',
    sort,
    onSort
}: DataTableProps<T>) {
    const colSpan = columns.length;

    const containerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const floatingScrollRef = useRef<HTMLDivElement>(null);
    const [showFloatingScroll, setShowFloatingScroll] = useState(false);
    const [scrollWidth, setScrollWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    // Sync scroll logic
    useEffect(() => {
        const container = containerRef.current;
        const floating = floatingScrollRef.current;
        const table = tableRef.current;

        if (!container || !floating || !table) return;

        const handleContainerScroll = () => {
            if (floating && container) {
                floating.scrollLeft = container.scrollLeft;
            }
        };

        const handleFloatingScroll = () => {
            if (floating && container) {
                container.scrollLeft = floating.scrollLeft;
            }
        };

        const updateDimensions = () => {
            if (container && table) {
                setScrollWidth(table.scrollWidth);
                setContainerWidth(container.clientWidth);
            }
        };

        // Visibility logic
        const checkVisibility = () => {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const isHorizontallyScrollable = table ? table.scrollWidth > container.clientWidth : false;

            // Show if:
            // 1. Table has horizontal scroll
            // 2. Top of table is above bottom of viewport (visible or above)
            // 3. Bottom of table is below bottom of viewport (use buffer to hide early)
            const isVisible =
                isHorizontallyScrollable &&
                rect.top < window.innerHeight &&
                rect.bottom > window.innerHeight + 20; // 20px buffer ensures it hides before native scrollbar fully appears

            setShowFloatingScroll(isVisible);
        };

        container.addEventListener('scroll', handleContainerScroll);
        floating.addEventListener('scroll', handleFloatingScroll);
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('resize', checkVisibility);
        // Use capture phase to detect scroll events from any container
        window.addEventListener('scroll', checkVisibility, true);

        // Initial check
        updateDimensions();
        checkVisibility();

        // Observer for size changes in table
        const resizeObserver = new ResizeObserver(() => {
            updateDimensions();
            checkVisibility();
        });
        resizeObserver.observe(table);

        return () => {
            container.removeEventListener('scroll', handleContainerScroll);
            floating.removeEventListener('scroll', handleFloatingScroll);
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('resize', checkVisibility);
            window.removeEventListener('scroll', checkVisibility, true);
            resizeObserver.disconnect();
        };
    }, [data, columns]); // Re-run when data changes

    return (
        <div className={`relative ${className}`}>
            <div
                ref={containerRef}
                className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"
            >
                <table ref={tableRef} className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 sticky top-0 z-10">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`${col.className || 'px-6 py-4'} ${col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors select-none' : ''}`}
                                    onClick={() => col.sortable && onSort?.(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sort && sort.key === col.key && (
                                            <span className="material-symbols-outlined text-sm font-bold text-brand-blue">
                                                {sort.order === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                        {col.sortable && (!sort || sort.key !== col.key) && (
                                            <span className="material-symbols-outlined text-sm font-bold text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                unfold_more
                                            </span>
                                        )}
                                    </div>
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
                                    className={onRowClick ? 'hover:bg-gray-50 cursor-pointer transition-colors' : 'hover:bg-gray-50 transition-colors'}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={col.className || 'px-6 py-4'}>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-white rounded-b-xl border-x-gray-200 border-b-gray-200">
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

            {/* Floating Scrollbar */}
            <div
                ref={floatingScrollRef}
                className={`fixed bottom-0 z-50 overflow-x-auto bg-gray-100/80 backdrop-blur-sm border-t border-gray-200 transition-opacity duration-200 ${showFloatingScroll ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                style={{
                    width: containerWidth,
                    left: containerRef.current?.getBoundingClientRect().left
                }}
            >
                <div style={{ width: scrollWidth, height: '12px' }}></div>
            </div>
        </div>
    );
}
