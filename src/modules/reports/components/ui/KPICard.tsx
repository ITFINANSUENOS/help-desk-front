import { type Clasificacion, getHexClasificacion } from '../../utils/colores';
import { Icon } from '../../../../shared/components/Icon';

interface KPICardProps {
    titulo: string;
    valor: string | number;
    subtitulo?: string;
    icono: string;
    clasificacion?: Clasificacion;
    sufijo?: string;
    isLoading?: boolean;
}

export const KPICard = ({
    titulo,
    valor,
    subtitulo,
    icono,
    clasificacion,
    sufijo,
    isLoading
}: KPICardProps) => {
    if (isLoading) {
        return <div className="h-28 bg-gray-200 animate-pulse rounded-lg shadow-sm w-full"></div>;
    }

    const borderColor = clasificacion ? getHexClasificacion(clasificacion) : '#43BBCA'; // brand-teal

    return (
        <div
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between border-l-4"
            style={{ borderLeftColor: borderColor }}
        >
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{titulo}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-2xl font-bold text-gray-900">{valor}</h3>
                    {sufijo && <span className="text-sm font-medium text-gray-500">{sufijo}</span>}
                </div>
                {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
            </div>
            <div className="flex items-center justify-center p-3 bg-blue-50 text-[#43BBCA] rounded-full">
                <Icon name={icono} className="text-2xl" />
            </div>
        </div>
    );
};
