import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { toast } from 'sonner';
import { templateService } from '../../templates/services/template.service';
import { api } from '../../../core/api/api';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

interface Campo {
    id: number;
    nombre: string;
    codigo: string;
    coordX: number;
    coordY: number;
    etiqueta?: string;
    fontSize?: number;
    pagina?: number;
}

interface ModalSelectorCoordenadasProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pasoId?: number;
    campo: Campo | null;
    pdfUrl: string | null;
    onSave: (campoId: number, coordX: number, coordY: number) => void;
}

export const ModalSelectorCoordenadas = ({
    open,
    onOpenChange,
    campo,
    pdfUrl,
    onSave
}: ModalSelectorCoordenadasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
    const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [picking, setPicking] = useState(true);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);
    const [marker, setMarker] = useState<{ x: number; y: number; page: number } | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; pdfX: number; pdfY: number } | null>(null);

    useEffect(() => {
        if (!open || !pdfUrl) {
            pdfDocRef.current = null;
            return;
        }

        let cancelled = false;
        let objectUrl: string | null = null;
        setPdfLoading(true);
        setError(null);

        // Download PDF with axios (includes auth cookies) then load into pdfjs
        api.get(pdfUrl, { responseType: 'blob' })
            .then(res => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);
                return pdfjsLib.getDocument(objectUrl).promise;
            })
            .then(doc => {
                if (cancelled) {
                    if (objectUrl) URL.revokeObjectURL(objectUrl);
                    return;
                }
                pdfDocRef.current = doc;
                setTotalPages(doc.numPages);
                setPdfLoading(false);
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err.message || 'Error al cargar PDF');
                    setPdfLoading(false);
                }
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [open, pdfUrl]);

    useEffect(() => {
        if (!pdfDocRef.current || pdfLoading || !canvasRef.current) return;

        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        pdfDocRef.current.getPage(currentPage).then(pdfPage => {
            const vp = pdfPage.getViewport({ scale });
            setViewport(vp);

            const canvas = canvasRef.current!;
            canvas.width = vp.width;
            canvas.height = vp.height;

            const overlay = overlayRef.current;
            if (overlay) {
                overlay.width = vp.width;
                overlay.height = vp.height;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const task = pdfPage.render({ canvasContext: ctx, viewport: vp });
            renderTaskRef.current = task;

            task.promise
                .then(() => {
                    renderTaskRef.current = null;
                    drawMarker();
                })
                .catch(() => {});
        });
    }, [currentPage, scale, pdfLoading]);

    const drawMarker = useCallback(() => {
        const overlay = overlayRef.current;
        const vp = viewport;
        if (!overlay || !vp) return;

        const ctx = overlay.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (!marker || marker.page !== currentPage) return;

        const px = marker.x;
        const py = marker.y;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(px - 12, py);
        ctx.lineTo(px + 12, py);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px, py - 12);
        ctx.lineTo(px, py + 12);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
    }, [marker, currentPage, viewport]);

    useEffect(() => {
        drawMarker();
    }, [drawMarker]);

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!picking || !viewport || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        const [pdfX, pdfY] = viewport.convertToPdfPoint(canvasX, canvasY);

        const pageHeight = viewport.viewBox[3];
        const y_fromTop = Math.round(pageHeight - pdfY);

        setCoords({
            x: Math.round(pdfX),
            y: y_fromTop
        });

        setMarker({
            x: canvasX,
            y: canvasY,
            page: currentPage
        });
    }, [picking, viewport, currentPage]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!picking || !viewport || !canvasRef.current) {
            setTooltip(null);
            return;
        }

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;

        const [pdfX, pdfY] = viewport.convertToPdfPoint(cx, cy);
        const pageHeight = viewport.viewBox[3];

        setTooltip({
            x: e.clientX,
            y: e.clientY,
            pdfX: Math.round(pdfX),
            pdfY: Math.round(pageHeight - pdfY)
        });
    }, [picking, viewport]);

    const handleSave = async () => {
        if (!campo) return;

        setLoading(true);
        try {
            await templateService.updateCampoCoordenadas(campo.id, coords.x, coords.y);
            onSave(campo.id, coords.x, coords.y);
            toast.success('Coordenadas guardadas');
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving coordinates:', error);
            toast.error('Error al guardar coordenadas');
        } finally {
            setLoading(false);
        }
    };

    const clearMarker = () => {
        setMarker(null);
        setCoords({ x: 0, y: 0 });
    };

    return (
        <Modal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={`Seleccionar Coordenadas - ${campo?.nombre || ''}`}
            className="max-w-7xl"
        >
            <div className="space-y-4">
                <div className="flex gap-4">
                    {/* PDF Canvas */}
                    <div className="flex-1 bg-gray-100 rounded-lg border overflow-hidden" style={{ height: '600px' }}>
                        {pdfLoading && (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Cargando PDF...
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center justify-center h-full text-red-500">
                                Error: {error}
                            </div>
                        )}
                        {!pdfLoading && !error && pdfUrl && (
                            <div className="h-full overflow-auto bg-gray-900 p-4 flex justify-center">
                                <div className="relative inline-block">
                                    <canvas
                                        ref={canvasRef}
                                        className={picking ? 'cursor-crosshair' : ''}
                                        onClick={handleCanvasClick}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                    <canvas
                                        ref={overlayRef}
                                        className="absolute top-0 left-0 pointer-events-none"
                                    />
                                </div>
                            </div>
                        )}
                        {!pdfUrl && (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                No hay PDF disponible
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="w-80 space-y-4">
                        {/* Toolbar */}
                        <div className="bg-gray-50 p-3 rounded-lg border space-y-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50"
                                >
                                    ◀
                                </button>
                                <span className="text-sm flex-1 text-center">
                                    Página {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50"
                                >
                                    ▶
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
                                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                                >
                                    −
                                </button>
                                <span className="text-sm flex-1 text-center">{Math.round(scale * 100)}%</span>
                                <button
                                    onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
                                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => setPicking(p => !p)}
                                className={`w-full py-1 rounded text-sm font-medium ${
                                    picking
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                                {picking ? '🎯 Capturando - Click en PDF' : '🖱 Navegar'}
                            </button>
                        </div>

                        {/* Coordinates Display */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-3">Coordenadas Capturadas</h4>
                            
                            {marker ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-blue-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">X</div>
                                            <div className="text-lg font-bold text-blue-600">{coords.x}</div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">Y (desde arriba)</div>
                                            <div className="text-lg font-bold text-blue-600">{coords.y}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                        Página: {currentPage}
                                    </div>
                                    <button
                                        onClick={clearMarker}
                                        className="w-full py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    <p>Haz click en el PDF para capturar coordenadas</p>
                                </div>
                            )}

                            <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                                <p className="font-medium">Coordenadas actuales en BD:</p>
                                <p>X: {campo?.coordX || 0}, Y: {campo?.coordY || 0}</p>
                            </div>
                        </div>

                        {/* Field Info */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-2">Información del Campo</h4>
                            <p className="text-sm"><strong>Nombre:</strong> {campo?.nombre}</p>
                            <p className="text-sm"><strong>Código:</strong> {campo?.codigo}</p>
                            <p className="text-sm"><strong>Etiqueta:</strong> {campo?.etiqueta || 'Sin etiqueta'}</p>
                        </div>

                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-center text-sm text-blue-600 hover:underline"
                            >
                                Abrir PDF en nueva pestaña
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="brand" 
                        onClick={handleSave}
                        disabled={loading || !marker}
                    >
                        {loading ? 'Guardando...' : 'Guardar Coordenadas'}
                    </Button>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && picking && (
                <div
                    className="fixed z-50 bg-gray-900 border border-blue-500 rounded-lg px-3 py-2 text-xs text-white pointer-events-none"
                    style={{ left: tooltip.x + 15, top: tooltip.y }}
                >
                    <div>x: {tooltip.pdfX}</div>
                    <div>y↓: {tooltip.pdfY}</div>
                </div>
            )}
        </Modal>
    );
};
