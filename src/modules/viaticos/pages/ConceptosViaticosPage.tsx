import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { viaticosService, type ViaticoConcepto, type CreateConceptoDto, type UpdateConceptoDto } from '../services/viaticos.service';
import { CreateConceptoModal } from '../components/CreateConceptoModal';
import { EditConceptoModal } from '../components/EditConceptoModal';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Icon } from '../../../shared/components/Icon';

const CATEGORIAS_LABELS: Record<string, string> = {
    manutencion: 'Manutención',
    alojamiento: 'Alojamiento',
    transporte: 'Transporte',
    otro: 'Otro',
};

export default function ConceptosViaticosPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [conceptoToDelete, setConceptoToDelete] = useState<ViaticoConcepto | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [conceptos, setConceptos] = useState<ViaticoConcepto[]>([]);
    const [selectedItem, setSelectedItem] = useState<ViaticoConcepto | null>(null);

    useEffect(() => {
        setTitle('Conceptos de Viáticos');
    }, [setTitle]);

    const loadConceptos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await viaticosService.getConceptos();
            setConceptos(data);
        } catch (error) {
            console.error('Error loading conceptos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConceptos();
    }, [loadConceptos]);

    const filteredConceptos = conceptos.filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async (data: CreateConceptoDto) => {
        setLoading(true);
        try {
            await viaticosService.createConcepto(data);
            await loadConceptos();
        } catch (error) {
            console.error('Error creating concepto:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (data: UpdateConceptoDto) => {
        if (!selectedItem) return;
        setLoading(true);
        try {
            await viaticosService.updateConcepto(selectedItem.id, data);
            await loadConceptos();
        } catch (error) {
            console.error('Error updating concepto:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!conceptoToDelete) return;
        setLoading(true);
        try {
            await viaticosService.deleteConcepto(conceptoToDelete.id);
            await loadConceptos();
        } catch (error) {
            console.error('Error deleting concepto:', error);
        } finally {
            setLoading(false);
            setShowDeleteDialog(false);
            setConceptoToDelete(null);
        }
    };

    const filterConfig: FilterConfig[] = [
        {
            type: 'search',
            name: 'search',
            value: searchQuery,
            onChange: (value) => setSearchQuery(String(value)),
            placeholder: 'Buscar concepto...',
        },
    ];

    const columns = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (row: ViaticoConcepto) => row.nombre
        },
        {
            key: 'categoria',
            header: 'Categoría',
            render: (row: ViaticoConcepto) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.categoria === 'manutencion' ? 'bg-blue-100 text-blue-800' :
                    row.categoria === 'alojamiento' ? 'bg-purple-100 text-purple-800' :
                    row.categoria === 'transporte' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {CATEGORIAS_LABELS[row.categoria] || row.categoria}
                </span>
            )
        },
        {
            key: 'topeDiario',
            header: 'Tope Diario',
            render: (row: ViaticoConcepto) => row.topeDiario > 0 
                ? `$${row.topeDiario.toLocaleString('es-CO')}` 
                : 'Sin límite'
        },
        {
            key: 'requiereFactura',
            header: 'Factura',
            render: (row: ViaticoConcepto) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.requiereFactura ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                    {row.requiereFactura ? 'Requerida' : 'Opcional'}
                </span>
            )
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (row: ViaticoConcepto) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.estado === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {row.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (row: ViaticoConcepto) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setSelectedItem(row);
                            setShowEditModal(true);
                        }}
                        className="text-gray-400 hover:text-brand-teal transition-colors"
                        title="Editar"
                    >
                        <Icon name="edit" className="text-[20px]" />
                    </button>
                    <button
                        onClick={() => {
                            setConceptoToDelete(row);
                            setShowDeleteDialog(true);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                    >
                        <Icon name="trash" className="text-[20px]" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Conceptos de Viáticos</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona los conceptos de gastos para viáticos
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Icon name="add" className="mr-2" />
                    Nuevo Concepto
                </Button>
            </div>

            {/* Modals */}
            <CreateConceptoModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditConceptoModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleEdit}
                concepto={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setConceptoToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Concepto"
                message={`¿Estás seguro de eliminar el concepto "${conceptoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={filteredConceptos}
                columns={columns}
                getRowKey={(row) => row.id}
                loading={loading}
                emptyMessage="No hay conceptos de viáticos"
                loadingMessage="Cargando conceptos..."
            />
        </>
    );
}
