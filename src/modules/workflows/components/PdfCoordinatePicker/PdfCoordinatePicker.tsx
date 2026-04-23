import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PlacementMarkerComponent } from './PlacementMarker';
import type { PlacementMarker, PdfClickCoord, PickerMode } from './types';
import { Button } from '../../../../shared/components/Button';
import { Icon } from '../../../../shared/components/Icon';
import { Input } from '../../../../shared/components/Input';
import type { Position } from '../../../../shared/interfaces/Catalog';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PendingPlacement {
  coord: PdfClickCoord;
  etiqueta: string;
  cargosIds: number[];
}

interface PdfCoordinatePickerProps {
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

export const PdfCoordinatePicker = ({
  pdfUrl,
  markers,
  mode,
  positions,
  onSave,
  onDeleteMarker,
  selectedMarkerId,
}: PdfCoordinatePickerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [pending, setPending] = useState<PendingPlacement | null>(null);
  const [etiqueta, setEtiqueta] = useState('');
  const [selectedCargos, setSelectedCargos] = useState<number[]>([]);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height });
  };

  const handlePageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();

      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      const pdfX = clickX;
      const pdfY = pageSize.height - clickY;

      setPending({
        coord: {
          x: Math.round(pdfX),
          y: Math.round(pdfY),
          page: currentPage,
        },
        etiqueta: '',
        cargosIds: [],
      });
      setEtiqueta('');
      setSelectedCargos([]);
    },
    [pageSize.height, currentPage],
  );

  const handleSave = () => {
    if (!pending) return;
    onSave({
      coordX: pending.coord.x,
      coordY: pending.coord.y,
      pagina: pending.coord.page,
      etiqueta,
      cargosIds: selectedCargos,
      nombre,
      codigo,
    });
    setPending(null);
    setEtiqueta('');
    setSelectedCargos([]);
    setNombre('');
    setCodigo('');
  };

  const handleCancel = () => {
    setPending(null);
    setEtiqueta('');
    setSelectedCargos([]);
    setNombre('');
    setCodigo('');
  };

  const toggleCargo = (cargoId: number) => {
    setSelectedCargos(prev =>
      prev.includes(cargoId)
        ? prev.filter(id => id !== cargoId)
        : [...prev, cargoId]
    );
  };

  const markersOnPage = markers.filter((m) => m.pagina === currentPage);

  return (
    <div className="flex h-full">
      {/* Left: PDF Viewer */}
      <div className="flex-1 flex flex-col border-r">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {mode === 'firma' ? 'Zonas de Firma' : 'Campos de Plantilla'}
            </span>
            <span className="text-xs text-gray-500">
              ({markers.length} placement{markers.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Página {currentPage} de {numPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <Icon name="chevron_left" className="text-[18px]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              <Icon name="chevron_right" className="text-[18px]" />
            </Button>
          </div>
        </div>

        {/* PDF */}
        <div className="flex-1 overflow-auto bg-gray-200 p-4">
          <div className="relative inline-block mx-auto shadow-lg">
            <div
              className="relative cursor-crosshair"
              onClick={handlePageClick}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <span className="text-gray-500">Cargando PDF...</span>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  onLoadSuccess={onPageLoadSuccess}
                  width={pageSize.width || 600}
                />
              </Document>

              {/* Pending placement marker */}
              {pending && pending.coord.page === currentPage && (
                <div
                  className="absolute bg-red-500 bg-opacity-30 border-2 border-red-500 rounded"
                  style={{
                    left: pending.coord.x - 30,
                    top: pageSize.height - pending.coord.y - 15,
                    width: 60,
                    height: 30,
                  }}
                />
              )}

              {/* Existing markers */}
              {markersOnPage.map((marker) => (
                <PlacementMarkerComponent
                  key={marker.id}
                  marker={marker}
                  pageHeight={pageSize.height}
                  scale={1}
                  onSelect={() => {}}
                  onDelete={onDeleteMarker}
                  selected={selectedMarkerId}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 px-4 py-2 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            <Icon name="info" className="inline text-[14px] mr-1" />
            Haz click en el PDF para {mode === 'firma' ? 'agregar zona de firma' : 'agregar campo'}.
          </p>
        </div>
      </div>

      {/* Right: Config Panel */}
      <div className="w-80 bg-white flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">
            {mode === 'firma' ? 'Configurar Zona de Firma' : 'Configurar Campo'}
          </h3>
          {pending && (
            <p className="text-xs text-gray-500 mt-1">
              X: {pending.coord.x} | Y: {pending.coord.y} | Pág: {pending.coord.page}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!pending ? (
            <div className="text-center text-gray-400 mt-8">
              <Icon name="edit" className="text-[48px] mx-auto mb-2 opacity-30" />
              <p className="text-sm">Haz click en el PDF para placing</p>
              <p className="text-xs mt-1">Luego configura aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Etiqueta PDF (Smart Tag)"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="Ej. FIRMA_GERENTE"
              />

              {mode === 'firma' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargos Permitidos
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Dejar vacío = cualquier cargo puede firmar
                  </p>
                  <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
                    {positions.map(p => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCargos.includes(Number(p.id))}
                          onChange={() => toggleCargo(Number(p.id))}
                          className="rounded border-gray-300"
                        />
                        {p.nombre}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'campo' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Cédula"
                  />
                  <Input
                    label="Código"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej. cedula"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {pending && (
          <div className="p-4 border-t bg-gray-50 flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button size="sm" variant="brand" onClick={handleSave} className="flex-1">
              Guardar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};