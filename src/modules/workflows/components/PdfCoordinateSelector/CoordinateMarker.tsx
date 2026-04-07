import { cn } from '../../../../shared/lib/utils';

interface CoordinateMarkerProps {
    coordX: number;
    coordY: number;
    escala: number;
    etiqueta?: string;
    isSelected?: boolean;
    color?: 'red' | 'blue' | 'green';
}

export function CoordinateMarker({
    coordX,
    coordY,
    escala,
    etiqueta,
    isSelected = false,
    color = 'red'
}: CoordinateMarkerProps) {
    // Las coordenadas en BD son top-left (legacy), solo ajustamos por escala
    const screenX = coordX / escala;
    const screenY = coordY / escala;

    const colorClasses = {
        red: 'border-red-500 bg-red-500/20',
        blue: 'border-blue-500 bg-blue-500/20',
        green: 'border-green-500 bg-green-500/20',
    };

    return (
        <div
            className={cn(
                'absolute pointer-events-none border-2 rounded flex items-center justify-center',
                isSelected ? 'border-yellow-500 bg-yellow-500/30' : colorClasses[color]
            )}
            style={{
                left: screenX,
                top: screenY,
                minWidth: 100 / escala,
                minHeight: 40 / escala,
                transform: 'translate(-50%, -50%)',
            }}
        >
            {etiqueta && (
                <span
                    className={cn(
                        'absolute text-xs px-1 py-0.5 rounded whitespace-nowrap',
                        isSelected ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                    )}
                    style={{
                        top: -20 / escala,
                        fontSize: 10 / escala,
                    }}
                >
                    {etiqueta}
                </span>
            )}
            {/* Crosshair indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full border-t border-dashed border-inherit opacity-50" />
                <div className="h-full border-l border-dashed border-inherit opacity-50" />
            </div>
        </div>
    );
}
