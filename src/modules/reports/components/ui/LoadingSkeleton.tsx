import { twMerge } from 'tailwind-merge';

interface LoadingSkeletonProps {
    rows?: number;
    cols?: number;
    type?: 'table' | 'card';
    className?: string;
}

export const LoadingSkeleton = ({ rows = 1, cols = 1, type = 'card', className }: LoadingSkeletonProps) => {
    if (type === 'table') {
        return (
            <div className={twMerge('w-full space-y-4', className)}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                        {Array.from({ length: cols }).map((_, j) => (
                            <div key={j} className="h-10 bg-gray-200 animate-pulse rounded flex-1"></div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={twMerge('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-lg shadow-sm"></div>
            ))}
        </div>
    );
};
