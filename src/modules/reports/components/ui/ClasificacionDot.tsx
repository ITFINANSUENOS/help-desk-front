import { type Clasificacion, getHexClasificacion } from '../../utils/colores';
import { twMerge } from 'tailwind-merge';

interface ClasificacionDotProps {
    clasificacion: Clasificacion;
    label?: string;
    className?: string;
}

export const ClasificacionDot = ({ clasificacion, label, className }: ClasificacionDotProps) => {
    const colorHex = getHexClasificacion(clasificacion);

    return (
        <div className={twMerge('flex items-center gap-2', className)}>
            <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorHex }}
            />
            {label && <span className="text-sm text-gray-700">{label}</span>}
        </div>
    );
};
