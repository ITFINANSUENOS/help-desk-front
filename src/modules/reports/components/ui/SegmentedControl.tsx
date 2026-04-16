interface SegmentedControlProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
    return (
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        value === opt.value
                            ? 'bg-white text-[#2B378A] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}