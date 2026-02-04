import { useEffect, useRef, useState, type MouseEvent } from 'react';
import mermaid from 'mermaid';
import { ticketService } from '../services/ticket.service';
import { IconZoomIn, IconZoomOut, IconReload, IconArrowsMove } from '@tabler/icons-react';

interface MermaidGraphProps {
    ticketId: number;
}



export function MermaidGraph({ ticketId }: MermaidGraphProps) {
    const [graphDefinition, setGraphDefinition] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            themeVariables: {
                primaryColor: '#f0f9ff',
                primaryTextColor: '#334155',
                primaryBorderColor: '#cbd5e1',
                lineColor: '#94a3b8',
                secondaryColor: '#fdfce7',
                tertiaryColor: '#fff',
            },
            flowchart: {
                curve: 'basis',
                htmlLabels: true,
                padding: 20
            }
        });
    }, []);

    useEffect(() => {
        if (!ticketId) return;
        setLoading(true);
        ticketService.getTicketMermaidGraph(ticketId)
            .then(data => {
                setGraphDefinition(data);
                // Reset transform when new graph loads
                setTransform({ scale: 1, x: 0, y: 0 });
            })
            .catch(err => console.error("Error loading workflow graph", err))
            .finally(() => setLoading(false));
    }, [ticketId]);

    useEffect(() => {
        if (!graphDefinition || !containerRef.current) return;

        const renderGraph = async () => {
            try {
                // Clear previous result
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, graphDefinition);
                    containerRef.current.innerHTML = svg;

                    // Remove fixed width/height attributes but DO NOT force 100% to avoid squashing
                    const svgElement = containerRef.current.querySelector('svg');
                    if (svgElement) {
                        const viewBox = svgElement.getAttribute('viewBox');
                        if (viewBox) {
                            const [, , w, h] = viewBox.split(' ').map(Number);
                            // Force physical size matching internal coordinates so it renders fully
                            svgElement.setAttribute('width', `${w}px`);
                            svgElement.setAttribute('height', `${h}px`);
                        }

                        // Let it be natural size so we can pan/zoom it
                        svgElement.style.maxWidth = 'none';
                    }
                }
            } catch (error) {
                console.error('Mermaid render error:', error);
                if (containerRef.current) {
                    containerRef.current.textContent = 'Error al renderizar el flujo.';
                }
            }
        };

        renderGraph();

    }, [graphDefinition]);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const onWheel = (e: globalThis.WheelEvent) => {
            e.preventDefault();
            const scaleAmount = -e.deltaY * 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale + scaleAmount), 20);

            setTransform(prev => ({
                ...prev,
                scale: newScale
            }));
        };

        // Attach non-passive listener to prevent default scrolling
        node.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            node.removeEventListener('wheel', onWheel);
        };
    }, [transform.scale]); // Re-bind if scale changes or use functional state update in handler (which we did) using ref might be better but dependency is fine here

    const handleMouseDown = (e: MouseEvent) => {
        setDragging(true);
        setStartPos({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        setTransform(prev => ({
            ...prev,
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        }));
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.5, 20) }));
    const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.5, 0.1) }));
    const resetZoom = () => setTransform({ scale: 1, x: 0, y: 0 });

    if (loading) return <div className="text-gray-400 text-xs text-center py-4">Cargando visualización del flujo...</div>;
    if (!graphDefinition) return <div className="text-gray-400 text-xs text-center py-4">No se encontraron datos del flujo para visualizar.</div>;

    return (
        <div className="relative w-full h-[400px] border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white p-2 rounded-md shadow-sm border border-slate-200">
                <button onClick={zoomIn} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Zoom In">
                    <IconZoomIn size={18} />
                </button>
                <button onClick={zoomOut} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Zoom Out">
                    <IconZoomOut size={18} />
                </button>
                <button onClick={resetZoom} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Reset View">
                    <IconReload size={18} />
                </button>
            </div>

            {/* Hint */}
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-white/80 backdrop-blur rounded-full border border-slate-200 text-xs text-slate-500 pointer-events-none flex items-center gap-2">
                <IconArrowsMove size={14} />
                Usa el mouse para arrastrar y hacer zoom
            </div>

            <div
                className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center origin-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            // Wheel handled by useEffect
            >
                <div
                    ref={containerRef}
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transition: dragging ? 'none' : 'transform 0.1s ease-out',
                        transformOrigin: 'center center'
                    }}
                    // Add generic font fix and ensure container fits content
                    className="font-sans w-max h-max"
                />
            </div>
        </div>
    );
}
