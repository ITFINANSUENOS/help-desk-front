export interface FilterOption {
    label: string;
    value: string | number;
}

export interface FilterConfig {
    type: 'search' | 'select';
    name: string;
    placeholder?: string;
    options?: FilterOption[];
    value: string | number;
    onChange: (value: string | number) => void;
}

interface FilterBarProps {
    filters: FilterConfig[];
    className?: string;
}

export function FilterBar({ filters, className = '' }: FilterBarProps) {
    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {filters.map((filter, index) => {
                    if (filter.type === 'search') {
                        return (
                            <div key={index} className="relative w-full max-w-md">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-gray-400">search</span>
                                </div>
                                <input
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-brand-teal focus:bg-white focus:ring-brand-teal"
                                    placeholder={filter.placeholder || 'Buscar...'}
                                    type="text"
                                    value={filter.value}
                                    onChange={(e) => filter.onChange(e.target.value)}
                                />
                            </div>
                        );
                    }

                    if (filter.type === 'select') {
                        return (
                            <div key={index} className="relative">
                                <select
                                    className="appearance-none rounded-lg border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-brand-teal focus:ring-brand-teal"
                                    value={filter.value}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Try to parse as number if it's not 'all'
                                        const parsedValue = value === 'all' ? 'all' : (isNaN(Number(value)) ? value : Number(value));
                                        filter.onChange(parsedValue);
                                    }}
                                >
                                    {filter.options?.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                </div>
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
}
