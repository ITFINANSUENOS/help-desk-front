import type { Position } from '../../positions/interfaces/Position';

export interface Organigrama {
    id: number;
    cargoId: number;
    jefeCargoId: number;
    estado: number;
    cargo?: Position;
    jefeCargo?: Position;
}

export interface CreateOrganigramaDto {
    cargoId: number;
    jefeCargoId: number;
    estado?: number;
}

// Tree structure for react-d3-tree
export interface OrganigramaTreeNode {
    name: string;
    attributes?: Record<string, string | number>;
    children?: OrganigramaTreeNode[];
    // Custom data to help identifying the node
    id?: number; // Position ID
    orgId?: number; // Link ID (if applicable for deletion)
}
