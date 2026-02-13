import { Select } from './Select';

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
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                            <div key={index} className="relative w-full xl:w-64">
                                <Select
                                    value={filter.value === 'all' ? undefined : filter.value}
                                    options={filter.options || []}
                                    onChange={(val) => {
                                        // If cleared or undefined, assuming 'all' might depend on implementation, 
                                        // but usually 'all' handling is custom. Select updates state.
                                        // If val is undefined/null, it might mean cleared.
                                        filter.onChange(val ?? 'all');
                                    }}
                                    placeholder={filter.placeholder || "Seleccione..."}
                                    isClearable={false}
                                />
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
}
