import type { PlacementMarker } from './types';

interface PlacementMarkerProps {
  marker: PlacementMarker;
  pageHeight: number;
  scale: number;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: string | null;
}

export const PlacementMarkerComponent = ({
  marker,
  pageHeight,
  scale,
  onSelect,
  onDelete,
  selected,
}: PlacementMarkerProps) => {
  // Convert PDF coords (bottom-left origin) to screen coords (top-left origin)
  const screenY = (pageHeight - marker.coordY) * scale;

  const isSelected = selected === marker.id;

  return (
    <div
      onClick={() => onSelect?.(marker.id)}
      className={`absolute cursor-pointer transition-all ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: marker.coordX * scale,
        top: screenY,
        transform: 'translateY(-100%)',
      }}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-md border ${
          isSelected
            ? 'bg-blue-500 text-white border-blue-600'
            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
        }`}
      >
        <span>{marker.label || 'Platz'}</span>
        {isSelected && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(marker.id);
            }}
            className="ml-1 text-red-600 hover:text-red-800 font-bold"
            title="Eliminar"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};