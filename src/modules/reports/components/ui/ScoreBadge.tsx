import { getTailwindClasificacion, getClasificacionCumplimiento } from '../../utils/colores';
import { formatScore } from '../../utils/formatters';
import { twMerge } from 'tailwind-merge';

interface ScoreBadgeProps {
    score: number;
    className?: string;
}

export const ScoreBadge = ({ score, className }: ScoreBadgeProps) => {
    const clasificacion = getClasificacionCumplimiento(score);
    const tailwindClasses = getTailwindClasificacion(clasificacion);

    return (
        <span className={twMerge(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold`, tailwindClasses, className)}>
            {formatScore(score)}
        </span>
    );
};
