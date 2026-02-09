import { useState, useCallback, useEffect } from 'react';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Button } from '../../../shared/components/Button';
import { OrganigramaTree } from '../components/OrganigramaTree';
import { AddRelationModal } from '../components/AddRelationModal';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { organigramaService } from '../services/organigrama.service';
import { positionService } from '../../positions/services/position.service';
import type { OrganigramaTreeNode } from '../interfaces/Organigrama';

export default function OrganigramaPage() {
    const { setTitle } = useLayout();
    const [treeData, setTreeData] = useState<OrganigramaTreeNode[]>([]);
    const [loading, setLoading] = useState(false);

    // UI State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedRelationId, setSelectedRelationId] = useState<number | null>(null);
    const [nodeToDeleteName, setNodeToDeleteName] = useState<string>('');

    useEffect(() => {
        setTitle('Organigrama Jerárquico');
    }, [setTitle]);

    const [showInactive, setShowInactive] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch raw relationships and all positions to build the tree
            const [relations, positionsResults] = await Promise.all([
                organigramaService.getAll(),
                positionService.getPositions({ limit: 1000 })
            ]);

            const tree = organigramaService.buildTree(relations, positionsResults.data, showInactive);
            setTreeData(tree);
        } catch (error) {
            console.error('Error loading organigrama:', error);
        } finally {
            setLoading(false);
        }
    }, [showInactive]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleNodeClick = (node: any) => {
        // Warning: Deleting a node in the tree conceptually means removing active relationships where it is the child?
        // Actually, we store OrgID in attributes when a node is a child in a relationship.
        const orgId = node.data?.attributes?.OrgID;
        if (orgId) {
            setSelectedRelationId(Number(orgId));
            setNodeToDeleteName(node.data.name);
            setShowDeleteDialog(true);
        } else {
            // Root nodes usually don't have OrgID as they aren't subordinates in this view context,
            // or if they are top level.
            // But if we want to delete a relationship, we need to click the child node that represents the link.

        }
    };

    const confirmDelete = async () => {
        if (selectedRelationId) {
            try {
                await organigramaService.delete(selectedRelationId);
                await loadData();
                setShowDeleteDialog(false);
                setSelectedRelationId(null);
            } catch (error) {
                console.error('Error deleting relationship:', error);
            }
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organigrama</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Visualiza y gestiona la estructura jerárquica de cargos.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
                        />
                        Mostrar Inactivos
                    </label>
                    <Button variant="outline" onClick={loadData} title="Refrescar">
                        <span className="material-symbols-outlined">refresh</span>
                    </Button>
                    <Button variant="brand" onClick={() => setShowAddModal(true)}>
                        <span className="material-symbols-outlined mr-2">add_link</span>
                        Nueva Relación
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[600px]">
                {loading ? (
                    <div className="flex h-96 items-center justify-center">
                        <span className="material-symbols-outlined animate-spin text-4xl text-brand-teal">autorenew</span>
                    </div>
                ) : (
                    <OrganigramaTree data={treeData} onNodeClick={handleNodeClick} />
                )}
            </div>

            <div className="mt-4 text-xs text-gray-400">
                <p>* Haz clic en un nodo hijo para eliminar su relación jerárquica con el padre.</p>
            </div>

            <AddRelationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadData}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setSelectedRelationId(null); }}
                onConfirm={confirmDelete}
                title="Eliminar Relación"
                message={`¿Estás seguro de que deseas desvincular el cargo "${nodeToDeleteName}" de su jefe actual?`}
                variant="danger"
                confirmText="Desvincular"
            />
        </>
    );
}
