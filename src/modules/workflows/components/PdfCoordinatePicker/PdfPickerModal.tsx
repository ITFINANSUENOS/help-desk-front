import { Modal } from '../../../../shared/components/Modal';
import { PdfCoordinatePicker } from './PdfCoordinatePicker';
import type { PlacementMarker, PickerMode } from './types';
import type { Position } from '../../../../shared/interfaces/Catalog';

interface PdfPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  markers: PlacementMarker[];
  mode: PickerMode;
  positions: Position[];
  onSave: (data: {
    coordX: number;
    coordY: number;
    pagina: number;
    etiqueta: string;
    cargosIds: number[];
    nombre?: string;
    codigo?: string;
    tipo?: string;
    fontSize?: number;
  }) => void;
  onDeleteMarker?: (id: string) => void;
  selectedMarkerId?: string | null;
}

export const PdfPickerModal = ({
  isOpen,
  onClose,
  pdfUrl,
  markers,
  mode,
  positions,
  onSave,
  onDeleteMarker,
  selectedMarkerId,
}: PdfPickerModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Seleccionar Coordenadas - ${mode === 'firma' ? 'Zona de Firma' : 'Campo'}`}
      className="max-w-5xl"
    >
      <div className="h-[75vh]">
        <PdfCoordinatePicker
          pdfUrl={pdfUrl}
          markers={markers}
          mode={mode}
          positions={positions}
          onSave={onSave}
          onDeleteMarker={onDeleteMarker}
          selectedMarkerId={selectedMarkerId}
        />
      </div>
    </Modal>
  );
};