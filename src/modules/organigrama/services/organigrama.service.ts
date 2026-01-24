import { api } from '../../../core/api/api';
import type { Organigrama, CreateOrganigramaDto, OrganigramaTreeNode } from '../interfaces/Organigrama';
import type { Position } from '../../positions/interfaces/Position';

interface OrganigramaResponse {
    data: Organigrama[];
    meta?: any;
}

class OrganigramaService {
    async getAll(): Promise<Organigrama[]> {
        const { data } = await api.get<OrganigramaResponse>('/organigrama?limit=1000'); // Get all for full tree
        return Array.isArray(data) ? data : data.data || [];
    }

    async create(dto: CreateOrganigramaDto): Promise<Organigrama> {
        const { data } = await api.post<Organigrama>('/organigrama', dto);
        return data;
    }

    async delete(id: number): Promise<void> {
        await api.delete(`/organigrama/${id}`);
    }

    // Helper to build tree from flat relationships
    buildTree(relationships: Organigrama[], allPositions: Position[], showInactive: boolean = false): OrganigramaTreeNode[] {
        // Filter by showInactive flag
        const filteredRelationships = showInactive ? relationships : relationships.filter(r => r.estado === 1);
        // If showInactive is false, we also filter out inactive positions to prevent them from showing as orphans
        const filteredPositions = showInactive ? allPositions : allPositions.filter(p => p.estado === 1);

        // 1. Build Adjacency List (Parent -> Children) and identify involved IDs
        const adj = new Map<number, number[]>();
        const relMap = new Map<number, number>(); // Child -> RelID (to store OrgID in attributes)
        const relevantIds = new Set<number>();

        filteredRelationships.forEach(rel => {
            const jefeId = Number(rel.jefeCargoId);
            const cargoId = Number(rel.cargoId);
            const relId = Number(rel.id);

            relevantIds.add(jefeId);
            relevantIds.add(cargoId);

            if (!adj.has(jefeId)) {
                adj.set(jefeId, []);
            }
            adj.get(jefeId)?.push(cargoId);
            relMap.set(cargoId, relId);
        });

        // Only consider positions that are actually used in the hierarchy
        const relevantPositions = filteredPositions.filter(p => relevantIds.has(Number(p.id)));

        // 2. Identify Roots (Nodes that are not children in any active relationship)
        // Set of all child IDs
        const childIds = new Set(filteredRelationships.map(r => Number(r.cargoId)));

        // Potential roots are positions not in childIds
        const roots: Position[] = relevantPositions.filter(p => !childIds.has(Number(p.id)));

        // 3. Recursive Builder with Cycle Detection
        const buildNode = (posId: number, visited: Set<number>): OrganigramaTreeNode | null => {
            const pos = relevantPositions.find(p => Number(p.id) === posId);
            if (!pos) return null;

            if (visited.has(posId)) {
                console.warn(`Cycle detected: Path [${Array.from(visited).join(' -> ')} -> ${posId}]`);
                return {
                    name: `${pos.nombre} (Ciclo)`,
                    attributes: { Warning: 'Referencia Circular', ID: pos.id },
                    id: pos.id
                };
            }

            const newVisited = new Set(visited);
            newVisited.add(posId);

            const childrenIds = adj.get(posId) || [];
            const children: OrganigramaTreeNode[] = [];

            for (const childId of childrenIds) {
                const childNode = buildNode(childId, newVisited);
                if (childNode) {
                    // Add OrgID from relation logic
                    const relId = relMap.get(childId);
                    if (relId && childNode.attributes) {
                        childNode.attributes.OrgID = relId;
                    }
                    children.push(childNode);
                }
            }

            return {
                name: pos.nombre,
                attributes: {
                    Estado: pos.estado === 1 ? 'Activo' : 'Inactivo',
                    ID: pos.id
                },
                children: children.length > 0 ? children : undefined,
                id: pos.id,
            };
        };

        // 4. Build Trees for each proper root
        const treeNodes: OrganigramaTreeNode[] = [];
        const visitedGlobal = new Set<number>(); // Track ALL nodes visited across all trees

        roots.forEach(root => {
            const rootId = Number(root.id);
            const node = buildNode(rootId, new Set());
            if (node) {
                treeNodes.push(node);
                // Helper to mark all descendants as visited globally
                const markVisited = (n: OrganigramaTreeNode) => {
                    if (n.id) visitedGlobal.add(n.id);
                    n.children?.forEach(markVisited);
                };
                markVisited(node);
            }
        });

        // 5. Handle Isolated Cycles (Nodes not reached by any root)
        const unvisitedIds = relevantPositions.map(p => Number(p.id)).filter(id => !visitedGlobal.has(id));

        if (unvisitedIds.length > 0) {
            console.warn('Found isolated cycles or orphaned nodes:', unvisitedIds);
            unvisitedIds.forEach(id => {
                if (!visitedGlobal.has(id)) {
                    // Force this node as a root to visualize the cycle
                    const node = buildNode(id, new Set());
                    if (node) {
                        const markVisited = (n: OrganigramaTreeNode) => {
                            if (n.id) visitedGlobal.add(n.id);
                            n.children?.forEach(markVisited);
                        };
                        markVisited(node);

                        node.name = `${node.name} (Ciclo Aislado)`;
                        node.attributes = { ...node.attributes, Warning: 'Ciclo Aislado' };
                        treeNodes.push(node);
                    }
                }
            });
        }

        // 6. Wrap in Virtual Root
        if (treeNodes.length === 0) return [];

        return [{
            name: 'Organización',
            attributes: { Tipo: 'Raíz Virtual' },
            children: treeNodes,
            id: -1
        }];
    }
}

export const organigramaService = new OrganigramaService();
