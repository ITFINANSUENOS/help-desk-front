interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    label?: string;
}

export function Pagination({ page, totalPages, onPageChange, label }: PaginationProps) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
                Anterior
            </button>
            <span className="px-3 py-1 text-xs text-gray-600">{page} / {totalPages}</span>
            <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
                Siguiente
            </button>
            {label && <span className="text-xs text-gray-500 ml-2">{label}</span>}
        </div>
    );
}