import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { zoneService } from '../services/zone.service';
import { CreateZoneModal } from '../components/CreateZoneModal';
import { EditZoneModal } from '../components/EditZoneModal';
import type { Zone, CreateZoneDto, UpdateZoneDto } from '../interfaces/Zone';
import { useLayout } from '../../../core/layout/context/LayoutContext';

export default function ZonesPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Zone | null>(null);

    useEffect(() => {
        setTitle('Gestión de Roles');
    }, [setTitle]);    

    // Función estable para cargar zonas
    const loadZones = useCallback(async () => {
        setLoading(true);
        try {
            const response = await zoneService.getZones({
                search: searchQuery,
                estado: estadoFilter,
                page,
                limit
            });
            setZones(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading zones:', error);
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
            loadZones();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, loadZones]);

    const handleCreate = async (data: CreateZoneDto) => {
        setLoading(true);
        try {
            await zoneService.createZone(data);
            await loadZones();
        } catch (error) {
            console.error('Error creating zone:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateZoneDto) => {
        setLoading(true);
        try {
            await zoneService.updateZone(id, data);
            await loadZones();
        } catch (error) {
            console.error('Error updating zone:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (zone: Zone) => {
        setZoneToDelete(zone);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (zoneToDelete) {
            setLoading(true);
            try {
                await zoneService.deleteZone(zoneToDelete.id);
                await loadZones();
                setShowDeleteDialog(false);
                setZoneToDelete(null);
            } catch (error) {
                console.error('Error deleting zone:', error);
                throw error;
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEdit = (zone: Zone) => {
        setSelectedItem(zone);
        setShowEditModal(true);
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (z: Zone) => `#${z.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (z: Zone) => <span className="font-medium text-gray-900">{z.nombre}</span>
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (z: Zone) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${z.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {z.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (z: Zone) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleEdit(z)}
                        className="text-gray-400 hover:text-brand-blue"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        onClick={() => handleDeleteClick(z)}
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
            placeholder: 'Buscar zonas...',
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
                    <h2 className="text-2xl font-bold text-gray-900">Zonas</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona las zonas geográficas
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Zona
                </Button>
            </div>

            {/* Modals */}
            <CreateZoneModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditZoneModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                zone={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setZoneToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Zona"
                message={`¿Estás seguro de que deseas eliminar la zona "${zoneToDelete?.nombre}"?`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={zones}
                columns={columns as any}
                getRowKey={(z) => z.id}
                loading={loading}
                emptyMessage="No se encontraron zonas"
                loadingMessage="Cargando zonas..."
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
