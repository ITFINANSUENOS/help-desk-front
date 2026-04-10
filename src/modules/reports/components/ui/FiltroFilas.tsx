interface FiltroFilasProps {
    value: number;
    onChange: (value: number) => void;
    options?: readonly number[];
    className?: string;
}

const DEFAULT_OPTIONS = [10, 25, 50] as const;

export const FiltroFilas = ({
    value,
    onChange,
    options = DEFAULT_OPTIONS,
    className,
}: FiltroFilasProps) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className || ''}`}>
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filas:</span>
            <select
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full sm:w-24 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-[#121617] focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal h-10 cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
};
