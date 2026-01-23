import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { regionService } from '../services/region.service';
import { CreateRegionModal } from '../components/CreateRegionModal';
import { EditRegionModal } from '../components/EditRegionModal';
import type { Regional, CreateRegionalDto, UpdateRegionalDto } from '../interfaces/Region';
import { useLayout } from '../../../core/layout/context/LayoutContext';


export default function RegionsPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [regionToDelete, setRegionToDelete] = useState<Regional | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [regions, setRegions] = useState<Regional[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Regional | null>(null);

    useEffect(() => {
        setTitle('Gestión de Roles');
    }, [setTitle]);

    // Función estable para cargar regionales
    const loadRegions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await regionService.getRegions({
                search: searchQuery,
                estado: estadoFilter,
                page,
                limit
            });
            setRegions(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading regions:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, estadoFilter, page, limit]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, estadoFilter]);

    // Cargar al montar y cuando cambian los filtros (con debounce para search)
    useEffect(() => {
        const timer = setTimeout(() => {
            loadRegions();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, loadRegions]);

    const handleCreate = async (data: CreateRegionalDto) => {
        setLoading(true);
        try {
            await regionService.createRegion(data);
            await loadRegions();
        } catch (error) {
            console.error('Error creating region:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateRegionalDto) => {
        setLoading(true);
        try {
            await regionService.updateRegion(id, data);
            await loadRegions();
        } catch (error) {
            console.error('Error updating region:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (region: Regional) => {
        setRegionToDelete(region);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (regionToDelete) {
            setLoading(true);
            try {
                await regionService.deleteRegion(regionToDelete.id);
                await loadRegions();
                setShowDeleteDialog(false);
                setRegionToDelete(null);
            } catch (error) {
                console.error('Error deleting region:', error);
                throw error; // Let the modal/dialog handle error if wired, or just log
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEdit = (region: Regional) => {
        setSelectedItem(region);
        setShowEditModal(true);
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (reg: Regional) => `#${reg.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (reg: Regional) => <span className="font-medium text-gray-900">{reg.nombre}</span>
        },
        {
            key: 'zona',
            header: 'Zona',
            render: (reg: Regional) => reg.zona?.nombre || '-'
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (reg: Regional) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${reg.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {reg.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (reg: Regional) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleEdit(reg)}
                        className="text-gray-400 hover:text-brand-blue"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        onClick={() => handleDeleteClick(reg)}
                        className="text-gray-400 hover:text-red-600"
                        title="Eliminar"
                    >
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
            placeholder: 'Buscar regionales...',
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
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Regionales</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona las regionales y su asignación a zonas
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Regional
                </Button>
            </div>

            {/* Modals */}
            <CreateRegionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditRegionModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                region={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setRegionToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Regional"
                message={`¿Estás seguro de que deseas eliminar la regional "${regionToDelete?.nombre}"?`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={regions}
                columns={columns as any}
                getRowKey={(reg) => reg.id}
                loading={loading}
                emptyMessage="No se encontraron regionales"
                loadingMessage="Cargando regionales..."
                pagination={{
                    page,
                    totalPages,
                    total,
                    limit,
                    onPageChange: setPage
                }}
            />
        </>
    );
}
