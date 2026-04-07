import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Modal } from '../../../../shared/components/Modal';
import { Button } from '../../../../shared/components/Button';
import { Icon } from '../../../../shared/components/Icon';
import { PageNavigator } from './PageNavigator';
import { CoordinateMarker } from './CoordinateMarker';
import { cn } from '../../../../shared/lib/utils';

// Configure pdfjs worker to use the version bundled with react-pdf (5.4.296)
// This avoids version mismatch errors
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

export interface ExistingZone {
    id: string | number;
    coordX: number;
    coordY: number;
    pagina: number;
    etiqueta?: string;
}

export interface CoordinateData {
    coordX: number;
    coordY: number;
    pagina: number;
}

interface PdfCoordinateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    /** URL to the PDF file */
    pdfUrl: string;
    /** Existing zones to display as markers */
    existingZones?: ExistingZone[];
    /** Callback when a coordinate is selected */
    onCoordinateSelect: (data: CoordinateData) => void;
    /** Type of zone for styling */
    zoneType?: 'signature' | 'field';
}

export function PdfCoordinateSelector({
    isOpen,
    onClose,
    pdfUrl,
    existingZones = [],
    onCoordinateSelect,
    zoneType = 'signature',
}: PdfCoordinateSelectorProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [selectedCoords, setSelectedCoords] = useState<CoordinateData | null>(null);
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
    }, []);

    const onPageLoadSuccess = useCallback((page: { getViewport: (options: { scale: number }) => { width: number; height: number } }) => {
        const viewport = page.getViewport({ scale: 1 });
        setPageSize({ width: viewport.width, height: viewport.height });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        setSelectedCoords(null);
    }, []);

    const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef) return;

        const rect = containerRef.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // Get click position relative to container
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Calculate actual scale being used (to fit the page in container)
        const scaleX = pageSize.width / containerWidth;
        const scaleY = pageSize.height / containerHeight;
        const actualScale = Math.min(scaleX, scaleY);

        // Calculate offset (center the page)
        const offsetX = (containerWidth - pageSize.width / actualScale) / 2;
        const offsetY = (containerHeight - pageSize.height / actualScale) / 2;

        // Adjust click position by offset
        const adjustedX = clickX - offsetX;
        const adjustedY = clickY - offsetY;

        // Calculate PDF coordinates (accounting for scale)
        // NOTA: Enviamos coordenadas top-left (como el usuario las ve)
        // El backend invertirá la Y con height - y - height (lógica legacy)
        const pdfX = adjustedX * actualScale;
        const pdfY = adjustedY * actualScale;

        if (pdfX < 0 || pdfY < 0 || pdfX > pageSize.width || pdfY > pageSize.height) {
            // Click was outside the page
            return;
        }

        const coords: CoordinateData = {
            coordX: Math.round(pdfX * 100) / 100,
            coordY: Math.round(pdfY * 100) / 100,
            pagina: currentPage,
        };

        setSelectedCoords(coords);
    }, [containerRef, pageSize, currentPage]);

    const handleConfirm = useCallback(() => {
        if (selectedCoords) {
            onCoordinateSelect(selectedCoords);
            onClose();
            setSelectedCoords(null);
        }
    }, [selectedCoords, onCoordinateSelect, onClose]);

    const handleClose = useCallback(() => {
        onClose();
        setSelectedCoords(null);
        setCurrentPage(1);
    }, [onClose]);

    // Filter zones for current page
    const currentPageZones = existingZones.filter(z => z.pagina === currentPage);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Seleccionar Posición - ${zoneType === 'signature' ? 'Zona de Firma' : 'Campo'}`}
            className="max-w-[90vw] max-h-[90vh]"
        >
            <div className="flex flex-col gap-4">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        <strong>Instrucciones:</strong> Haga clic en el PDF donde desea posicionar el {zoneType === 'signature' ? 'área de firma' : 'campo'}.
                        Las zonas existentes se muestran en rojo.
                    </p>
                </div>

                {/* Page Navigator */}
                {numPages > 0 && (
                    <PageNavigator
                        currentPage={currentPage}
                        totalPages={numPages}
                        onPageChange={handlePageChange}
                    />
                )}

                {/* PDF Container */}
                <div
                    ref={setContainerRef}
                    className={cn(
                        'relative bg-gray-200 rounded-lg overflow-auto flex justify-center',
                        'cursor-crosshair'
                    )}
                    style={{ maxHeight: '60vh' }}
                    onClick={handleContainerClick}
                >
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                                <span className="text-sm text-gray-500">Cargando PDF...</span>
                            </div>
                        </div>
                    )}

                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={null}
                        error={
                            <div className="flex items-center justify-center p-8 text-red-500">
                                Error al cargar el PDF. Verifique la URL.
                            </div>
                        }
                    >
                        <Page
                            pageNumber={currentPage}
                            onLoadSuccess={onPageLoadSuccess}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="relative"
                            width={containerRef ? Math.min(containerRef.clientWidth - 32, pageSize.width) : undefined}
                        />

                        {/* Existing zone markers */}
                        {currentPageZones.map((zone) => (
                            <CoordinateMarker
                                key={`zone-${zone.id}`}
                                coordX={zone.coordX}
                                coordY={zone.coordY}
                                escala={1}
                                etiqueta={zone.etiqueta}
                                color={zoneType === 'signature' ? 'red' : 'blue'}
                            />
                        ))}

                        {/* Selected coordinate marker */}
                        {selectedCoords && (
                            <CoordinateMarker
                                coordX={selectedCoords.coordX}
                                coordY={selectedCoords.coordY}
                                escala={1}
                                etiqueta="Nueva posición"
                                isSelected
                            />
                        )}
                    </Document>
                </div>

                {/* Selected coordinates display */}
                <div className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    selectedCoords ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                )}>
                    <div className="flex items-center gap-4">
                        <Icon
                            name={zoneType === 'signature' ? 'edit-signature' : 'edit'}
                            className="text-2xl text-gray-400"
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                {selectedCoords ? 'Posición seleccionada' : 'Sin posición seleccionada'}
                            </p>
                            {selectedCoords && (
                                <p className="text-xs text-gray-500">
                                    X: {selectedCoords.coordX} | Y: {selectedCoords.coordY} | Página: {selectedCoords.pagina}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCoords(null)}
                            disabled={!selectedCoords}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="brand"
                            onClick={handleConfirm}
                            disabled={!selectedCoords}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
