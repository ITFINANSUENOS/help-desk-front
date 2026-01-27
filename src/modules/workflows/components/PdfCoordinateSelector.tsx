import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { IconChevronLeft, IconChevronRight, IconX, IconZoomIn, IconZoomOut, IconLoader2 } from '@tabler/icons-react';
import { Button } from '../../../shared/components/Button';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PdfCoordinateSelectorProps {
    file: string | File;
    onSelect: (page: number, x: number, y: number) => void;
    onClose: () => void;
}

export const PdfCoordinateSelector = ({ file, onSelect, onClose }: PdfCoordinateSelectorProps) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0); // Start with 1.0 (72 DPI approx)
    const [isLoading, setIsLoading] = useState(true);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
    };

    const handlePageChange = (offset: number) => {
        setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages));
    };

    const handlePageClick = (event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();

        // Click coordinates relative to the visible element (CSS pixels)
        const x_css = event.clientX - rect.left;
        const y_css = event.clientY - rect.top;

        // Convert to millimeters using the legacy formula logic
        // Original: var x_mm = (x / scale) * (25.4 / 72);
        // We use the current scale state for division
        const x_mm = (x_css / scale) * (25.4 / 72);
        const y_mm = (y_css / scale) * (25.4 / 72);

        onSelect(pageNumber, Number(x_mm.toFixed(2)), Number(y_mm.toFixed(2)));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-lg p-2 mb-4 flex items-center gap-4 w-full max-w-4xl justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700 px-2">Selector de Coordenadas</h3>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePageChange(-1)}
                        disabled={pageNumber <= 1}
                    >
                        <IconChevronLeft size={20} />
                    </Button>
                    <span className="text-sm font-medium w-24 text-center">
                        Página {pageNumber} de {numPages || '--'}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePageChange(1)}
                        disabled={pageNumber >= numPages}
                    >
                        <IconChevronRight size={20} />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>
                        <IconZoomOut size={20} />
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.min(3, s + 0.25))}>
                        <IconZoomIn size={20} />
                    </Button>
                </div>

                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 border-red-200" onClick={onClose}>
                    <IconX size={20} className="mr-2" />
                    Cerrar
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 w-full max-w-6xl overflow-auto bg-gray-100 rounded-lg flex justify-center items-start p-8 shadow-inner border border-gray-600">
                <div className="relative shadow-2xl cursor-crosshair" onClick={handlePageClick}>
                    <Document
                        file={file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex flex-col items-center justify-center h-96 w-64 bg-white rounded">
                                <IconLoader2 className="animate-spin text-blue-500 mb-2" size={32} />
                                <span className="text-sm text-gray-500">Cargando PDF...</span>
                            </div>
                        }
                        error={
                            <div className="flex flex-col items-center justify-center h-96 w-64 bg-white rounded text-red-500 p-4">
                                <IconX size={32} className="mb-2" />
                                <span className="text-center">Error al cargar PDF.</span>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white"
                        />
                    </Document>
                </div>
            </div>

            <div className="mt-2 text-white text-sm">
                Haga clic en la posición deseada para capturar las coordenadas (X, Y).
            </div>
        </div>
    );
};
