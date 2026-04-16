interface CategoryPathProps {
    categoria?: string | null;
    subcategoria?: string | null;
}

export function CategoryPath({ categoria, subcategoria }: CategoryPathProps) {
    const parts = [categoria, subcategoria].filter(Boolean);
    return <span>{parts.join(' / ')}</span>;
}