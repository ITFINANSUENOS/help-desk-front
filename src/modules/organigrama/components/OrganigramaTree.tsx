import { useCallback, useState } from 'react';
import Tree from 'react-d3-tree';
import type { OrganigramaTreeNode } from '../interfaces/Organigrama';

interface OrganigramaTreeProps {
    data: OrganigramaTreeNode[];
    onNodeClick?: (node: any) => void;
}

// Custom Node Component
const renderForeignObjectNode = ({
    nodeDatum,
    toggleNode,
    foreignObjectProps
}: any) => (
    <g>
        {/* Card */}
        <foreignObject {...foreignObjectProps}>
            <div className="border border-brand-teal/20 bg-white rounded-lg shadow-sm p-2 w-full h-full flex flex-col justify-center items-center cursor-pointer hover:shadow-md transition-shadow" onClick={toggleNode}>
                <div className="font-bold text-sm text-gray-900 text-center">{nodeDatum.name}</div>
                {nodeDatum.attributes?.Estado && (
                    <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${nodeDatum.attributes.Estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {nodeDatum.attributes.Estado}
                    </div>
                )}
            </div>
        </foreignObject>
    </g>
);

export function OrganigramaTree({ data, onNodeClick }: OrganigramaTreeProps) {
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const containerRef = useCallback((containerElem: HTMLDivElement) => {
        if (containerElem !== null) {
            const { width } = containerElem.getBoundingClientRect();
            setTranslate({ x: width / 2, y: 50 }); // Center top
        }
    }, []);

    // Ensure array is not empty, tree requires objects
    if (data.length === 0) return (
        <div className="flex h-96 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="text-center text-gray-500">
                <span className="material-symbols-outlined mb-2 text-4xl">account_tree</span>
                <p>No hay datos de organigrama definidos.</p>
                <p className="text-sm">Agrega relaciones para visualizar el árbol.</p>
            </div>
        </div>
    );

    const nodeSize = { x: 220, y: 140 }; // Size of the space for each node (includes gap)
    const foreignObjectProps = { width: 200, height: 100, x: -100, y: -50 }; // Size of the card itself

    return (
        <div
            id="treeWrapper"
            className="w-full h-[600px] border border-gray-200 rounded-xl bg-gray-50 overflow-hidden"
            ref={containerRef}
        >
            <Tree
                data={data}
                translate={translate}
                renderCustomNodeElement={(rd3tProps) =>
                    renderForeignObjectNode({ ...rd3tProps, foreignObjectProps })
                }
                orientation="vertical"
                pathFunc="step"
                nodeSize={nodeSize}
                separation={{ siblings: 1.2, nonSiblings: 1.5 }}
                enableLegacyTransitions={true}
                transitionDuration={500}
                onNodeClick={(node) => onNodeClick && onNodeClick(node)}
            />
        </div>
    );
}
