interface LegendItem {
    label: string;
    color: string;
}

interface LegendProps {
    items: LegendItem[];
    title?: string;
}

export function Legend({ items, title }: LegendProps) {
    return (
        <div className="flex flex-col gap-1">
            {title && <span className="text-xs font-medium text-gray-700">{title}</span>}
            <div className="flex flex-wrap items-center gap-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <span className={`inline-block w-3 h-3 rounded ${item.color}`} />
                        <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}