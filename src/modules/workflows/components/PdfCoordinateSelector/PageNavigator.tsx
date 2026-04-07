import { Button } from '../../../../shared/components/Button';
import { Icon } from '../../../../shared/components/Icon';

interface PageNavigatorProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function PageNavigator({ currentPage, totalPages, onPageChange }: PageNavigatorProps) {
    return (
        <div className="flex items-center justify-center gap-4 p-3 bg-gray-100 rounded-lg">
            <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <Icon name="chevron-left" className="text-lg" />
            </Button>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Página</span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                        const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                        onPageChange(page);
                    }}
                    className="w-16 px-2 py-1 border rounded text-center text-sm"
                />
                <span className="text-sm text-gray-500">de {totalPages}</span>
            </div>

            <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <Icon name="chevron-right" className="text-lg" />
            </Button>
        </div>
    );
}
