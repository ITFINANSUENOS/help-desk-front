interface StatusBadgeProps {
    estado: string;
}

export function StatusBadge({ estado }: StatusBadgeProps) {
    const getBadgeClass = (estado: string) => {
        if (estado === 'Cerrado') {
            return 'px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800';
        }
        if (estado === 'Pausado') {
            return 'px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800';
        }
        return 'px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800';
    };

    return (
        <span className={getBadgeClass(estado)}>
            {estado}
        </span>
    );
}