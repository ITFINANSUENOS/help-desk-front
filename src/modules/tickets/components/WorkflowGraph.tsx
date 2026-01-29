import { useEffect, useState, useMemo } from 'react';
import Tree from 'react-d3-tree';
import { ticketService } from '../services/ticket.service';

interface WorkflowGraphProps {
    subcategoryId?: number;
    currentStepId: number;
    historyStepIds?: number[];
}

interface WorkflowData {
    pasos: any[];
    rutas: any[];
}

export function WorkflowGraph({ subcategoryId, currentStepId, historyStepIds = [] }: WorkflowGraphProps) {
    const [flowData, setFlowData] = useState<WorkflowData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!subcategoryId) return;
        setLoading(true);
        ticketService.getWorkflowGraph(subcategoryId)
            .then(data => setFlowData(data))
            .catch(err => console.error("Error loading workflow graph", err))
            .finally(() => setLoading(false));
    }, [subcategoryId, currentStepId]); // Add currentStepId to refetch if needed, though mostly static for subcat

    const treeData = useMemo(() => {
        if (!flowData || !flowData.pasos) return null;

        // --- PRE-PROCESSING ---
        const allStepsMap = new Map<number, any>();
        const adj = new Map<number, { id: number, label: string }[]>();
        const routeStartMap = new Map<number, number>(); // rutaId -> firstStepId
        const stepsInRoutes = new Set<number>();

        // 1. Index Route Steps FIRST to identify them
        if (flowData.rutas) {
            flowData.rutas.forEach((ruta: any) => {
                const rutaPasos = ruta.rutaPasos?.sort((a: any, b: any) => a.orden - b.orden) || [];

                if (rutaPasos.length > 0) {
                    // Record start of route
                    routeStartMap.set(ruta.id, rutaPasos[0].paso.id);

                    rutaPasos.forEach((rp: any, index: number) => {
                        const step = rp.paso;
                        // Mark as route step
                        stepsInRoutes.add(step.id);
                        allStepsMap.set(step.id, { ...step, isRoute: true, routeName: ruta.nombre });

                        // Linear connection within route
                        if (index < rutaPasos.length - 1) {
                            const nextStepId = rutaPasos[index + 1].paso.id;
                            if (!adj.has(step.id)) adj.set(step.id, []);
                            adj.get(step.id)?.push({ id: nextStepId, label: '' });
                        }
                    });
                }
            });
        }

        // 2. Index Main Flow Steps (Only if not already processed as route step, or merge info)
        flowData.pasos.forEach((p: any) => {
            if (!allStepsMap.has(p.id)) {
                allStepsMap.set(p.id, { ...p, isMain: true, isRoute: false });
            }
            // If it IS in a route, we prefer the route's context (already set), 
            // but we might need main flow transitions if they exist (rare for route steps but possible).
            // We'll process transitions for ALL steps below.
        });

        // Function to add edge
        const addEdge = (source: number, target: number, label: string = '') => {
            if (!adj.has(source)) adj.set(source, []);
            // Check existence logic
            const existing = adj.get(source)!.find((e: any) => e.id === target);
            if (!existing) {
                adj.get(source)!.push({ id: target, label });
            } else if (label && !existing.label) {
                existing.label = label;
            } else if (label && existing.label && !existing.label.includes(label)) {
                // Determine if we should concatenate or ignore duplicates
                if (!existing.label.split(' / ').includes(label)) {
                    existing.label += ` / ${label}`;
                }
            }
        };

        // 3. Build Connections (Adjacency Map)
        const processTransitions = (stepId: number, transitions: any[]) => {
            if (!transitions) return;
            transitions.forEach((t: any) => {
                // Priority: Route > Step (Legacy Logic matches this)
                if (t.rutaId) {
                    const routeStartId = routeStartMap.get(t.rutaId);
                    if (routeStartId) {
                        addEdge(stepId, routeStartId, t.condicionNombre || t.condicionClave);
                    }
                } else if (t.pasoDestinoId) {
                    addEdge(stepId, t.pasoDestinoId, t.condicionNombre || t.condicionClave);
                }
            });
        };

        // Process Main Steps Transitions
        flowData.pasos.forEach((p: any) => {
            processTransitions(p.id, p.transicionesOrigen);
        });

        // Process Route Steps Transitions (Explicit exits from route)
        if (flowData.rutas) {
            flowData.rutas.forEach((ruta: any) => {
                ruta.rutaPasos?.forEach((rp: any) => {
                    if (rp.paso && rp.paso.transicionesOrigen) {
                        processTransitions(rp.paso.id, rp.paso.transicionesOrigen);
                    }
                });
            });
        }

        // 4. Find Root (Lowest Order in Main Flow)
        const sortedMainSteps = [...flowData.pasos]
            .filter(p => !stepsInRoutes.has(p.id)) // Only purely main steps for linear logic
            .sort((a, b) => a.orden - b.orden);

        // Implicit connections for linear flow (no label)
        sortedMainSteps.forEach((p, idx) => {
            // Only add implicit edge if NO explicit edges exist? 
            if ((!p.transicionesOrigen || p.transicionesOrigen.length === 0) && idx < sortedMainSteps.length - 1) {
                addEdge(p.id, sortedMainSteps[idx + 1].id, ''); // No label
            }
        });

        // 5. Recursive Build Tree
        const buildNode = (stepId: number, path: Set<number>, incomingLabel: string = ''): any => {
            // Avoid infinite loops
            const currentDepth = path.size;
            if (currentDepth > 20) return { name: '...', attributes: { label: 'Limit' } };

            const step = allStepsMap.get(stepId);
            if (!step) return { name: 'Unknown', attributes: { label: 'Unknown' } };

            const isCurrent = step.id === currentStepId;
            const wasVisited = historyStepIds.includes(step.id);
            const isCycle = path.has(stepId);
            const isRoute = !!step.isRoute;
            const routeName = step.routeName;

            if (isCycle) {
                return {
                    name: `(↩ ${step.nombre})`,
                    attributes: {
                        isCurrent: false,
                        wasVisited,
                        stepId: step.id,
                        isCycle: true,
                        isRoute,
                        incomingLabel
                    },
                    nodeSvgShape: {
                        shape: 'rect',
                        shapeProps: {
                            width: 180,
                            height: 50,
                            fill: '#f8fafc',
                            stroke: '#94a3b8',
                            strokeDasharray: '5,5',
                        }
                    }
                };
            }

            const newPath = new Set(path);
            newPath.add(stepId);

            const childrenObjs = adj.get(stepId) || [];
            // Deduplicate children by ID but keep logic
            const uniqueChildrenIds = Array.from(new Set(childrenObjs.map((c: any) => c.id)));

            const children = uniqueChildrenIds.map(childId => {
                // find label(s)
                const cObj = childrenObjs.find((c: any) => c.id === childId);
                return buildNode(childId, newPath, cObj?.label || '');
            });

            return {
                name: step.nombre,
                attributes: {
                    isCurrent,
                    wasVisited,
                    stepId: step.id,
                    isRoute,
                    routeName,
                    incomingLabel
                },
                children: children.length > 0 ? children : undefined,
                nodeSvgShape: {
                    shape: 'rect',
                    shapeProps: {
                        width: 180,
                        height: 50,
                    }
                }
            };
        };

        if (sortedMainSteps.length === 0 && allStepsMap.size > 0) {
            // Fallback: Just take lowest ID or Order of anything
            // If we have 0 main steps but existing steps, likely ALL steps are in routes?
            // Or filters failed. Try finding *any* step with no incoming edges?
            // For now, fallback to first available step in map.
            const firstKey = allStepsMap.keys().next().value;
            if (firstKey) return buildNode(firstKey, new Set());
            return null;
        }
        const rootStep = sortedMainSteps.length > 0 ? sortedMainSteps[0] : null;

        if (!rootStep) return null;

        return buildNode(rootStep.id, new Set());

    }, [flowData, currentStepId, historyStepIds]);

    if (loading) return <div className="text-gray-400 text-xs">Cargando flujo...</div>;
    if (!treeData) return <div className="text-gray-400 text-xs">No se encontraron datos del flujo.</div>;

    return (
        <div style={{ width: '100%', height: '400px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc' }}>
            <Tree
                data={treeData}
                orientation="horizontal"
                pathFunc="step"
                translate={{ x: 50, y: 200 }}
                collapsible={false}
                renderCustomNodeElement={(rd3tProps) => renderNode(rd3tProps)}
                separation={{ siblings: 1.5, nonSiblings: 2 }}
                zoomable={true}
                scaleExtent={{ min: 0.5, max: 1.5 }}
                depthFactor={300}
            />
        </div>
    );
}

const renderNode = ({ nodeDatum }: any) => {
    const isCurrent = nodeDatum.attributes?.isCurrent;
    const wasVisited = nodeDatum.attributes?.wasVisited;
    const isCycle = nodeDatum.attributes?.isCycle;
    const isRoute = nodeDatum.attributes?.isRoute;
    const incomingLabel = nodeDatum.attributes?.incomingLabel;

    // Route steps get a slightly different color or border
    const baseFill = isCycle ? '#f8fafc' : (isCurrent ? '#f0f9ff' : (wasVisited ? '#f0fdf4' : (isRoute ? '#fff7ed' : '#ffffff')));
    const baseStroke = isCycle ? '#94a3b8' : (isCurrent ? '#0ea5e9' : (wasVisited ? '#22c55e' : (isRoute ? '#f97316' : '#cbd5e1')));

    return (
        <g>
            {/* Incoming Label (Floating text with halo using paint-order) */}
            {incomingLabel && (
                <g transform="translate(-170, -4)">
                    <text
                        textAnchor="middle"
                        style={{
                            fontSize: '11px',
                            fontWeight: '400',
                            fontFamily: 'sans-serif',
                            fill: wasVisited ? '#15803d' : '#475569',
                            stroke: '#f8fafc', // Matches graph background
                            strokeWidth: '3px',
                            strokeLinejoin: 'round',
                            paintOrder: 'stroke'
                        }}
                    >
                        {incomingLabel.length > 25 ? incomingLabel.substring(0, 23) + '...' : incomingLabel}
                    </text>
                    <title>{incomingLabel}</title>
                </g>
            )}

            <rect
                width="180" height="50" x="-90" y="-25" rx="8"
                fill={baseFill}
                stroke={baseStroke}
                strokeWidth={isCurrent ? 2 : 1}
                strokeDasharray={isCycle ? '4' : '0'}
                filter="drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))"
            />
            <foreignObject x="-85" y="-25" width="170" height="50">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontFamily: 'sans-serif',
                    fontWeight: isCurrent ? '600' : '400', // Thinner step text
                    color: isCycle ? '#64748b' : (isCurrent ? '#0369a1' : '#334155'),
                    lineHeight: '1.2',
                    padding: '0 4px',
                    fontStyle: isCycle ? 'italic' : 'normal'
                }}>
                    <div style={{ wordBreak: 'break-word', overflow: 'hidden', maxHeight: '48px' }}>
                        {nodeDatum.name}
                    </div>
                </div>
            </foreignObject>
        </g>
    );
}
