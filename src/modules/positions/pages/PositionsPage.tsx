import { useState, useCallback, useEffect } from 'react';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { positionService } from '../services/position.service';
import type { Position } from '../interfaces/Position';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { CreatePositionModal } from '../components/CreatePositionModal';
import { EditPositionModal } from '../components/EditPositionModal';

export default function PositionsPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Data
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Position | null>(null);

    useEffect(() => {
        setTitle('Gestión de Cargos');
    }, [setTitle]);

    const loadPositions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await positionService.getPositions({
                search: searchQuery,
                estado: estadoFilter,
                page,
                limit
            });
            setPositions(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading positions:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, estadoFilter, page, limit]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, estadoFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPositions();
        }, searchQuery ? 300 : 0);
        return () => clearTimeout(timer);
    }, [searchQuery, loadPositions]);

    const handleEdit = (position: Position) => {
        setSelectedItem(position);
        setShowEditModal(true);
    };

    const handleDeleteClick = (position: Position) => {
        setPositionToDelete(position);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (positionToDelete) {
            setLoading(true);
            try {
                await positionService.deletePosition(positionToDelete.id);
                await loadPositions();
                setShowDeleteDialog(false);
                setPositionToDelete(null);
            } catch (error) {
                console.error('Error deleting position:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (pos: Position) => `#${pos.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (pos: Position) => <div className="font-medium text-gray-900">{pos.nombre}</div>
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (pos: Position) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pos.estado === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {pos.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (pos: Position) => (
                <div className="flex gap-3">
                    <button onClick={() => handleEdit(pos)} className="text-gray-400 hover:text-brand-blue" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(pos)} className="text-gray-400 hover:text-red-600" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            )
        }
    ];

    const filterConfig: FilterConfig[] = [
        {
            type: 'search',
            name: 'search',
            placeholder: 'Buscar cargos...',
            value: searchQuery,
            onChange: (val) => setSearchQuery(val as string)
        },
        {
            type: 'select',
            name: 'estado',
            value: estadoFilter,
            onChange: (val) => setEstadoFilter(val as number | 'all'),
            options: [
                { label: 'Todos los Estados', value: 'all' },
                { label: 'Activos', value: 1 },
                { label: 'Inactivos', value: 0 }
            ]
        }
    ];

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cargos</h2>
                    <p className="mt-1 text-sm text-gray-500">Gestiona los cargos disponibles en el sistema</p>
                </div>
                <Button variant="brand" onClick={() => setShowCreateModal(true)}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Cargo
                </Button>
            </div>

            <CreatePositionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={loadPositions}
            />

            <EditPositionModal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setSelectedItem(null); }}
                onSuccess={loadPositions}
                position={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setPositionToDelete(null); }}
                onConfirm={confirmDelete}
                title="Eliminar Cargo"
                message={`¿Estás seguro de que deseas eliminar el cargo "${positionToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            <FilterBar filters={filterConfig} className="mb-6" />

            <DataTable
                data={positions}
                columns={columns}
                getRowKey={(pos) => pos.id}
                loading={loading}
                emptyMessage="No se encontraron cargos"
                loadingMessage="Cargando cargos..."
                pagination={{ page, totalPages, total, limit, onPageChange: setPage }}
            />
        </>
    );
}
