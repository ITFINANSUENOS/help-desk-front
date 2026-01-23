import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { subcategoryService } from '../services/subcategory.service';
import { categoryService } from '../../categories/services/category.service';
import { CreateSubcategoryModal } from '../components/CreateSubcategoryModal';
import { EditSubcategoryModal } from '../components/EditSubcategoryModal';
import type { Subcategory, CreateSubcategoryDto, UpdateSubcategoryDto } from '../interfaces/Subcategory';
import type { Category } from '../../categories/interfaces/Category';
import { useLayout } from '../../../core/layout/context/LayoutContext';

/**
 * Página principal de gestión de subcategorías
 */
export default function SubcategoriesPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Subcategory | null>(null);

    useEffect(() => {
        setTitle('Gestión de Subcategorías');
    }, [setTitle]);

    // Cargar categorías para filtros
    useEffect(() => {
        categoryService.getAll({ limit: 1000 }).then(res => setCategories(res.data)).catch(console.error);
    }, []);

    // Función estable para cargar subcategorías
    const loadSubcategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await subcategoryService.getSubcategories({
                search: searchQuery,
                estado: estadoFilter,
                categoriaId: categoryFilter,
                page,
                limit
            });
            setSubcategories(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading subcategories:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, estadoFilter, categoryFilter, page, limit]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, estadoFilter, categoryFilter]);

    // Cargar al montar y cuando cambian los filtros (con debounce para search)
    useEffect(() => {
        const timer = setTimeout(() => {
            loadSubcategories();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, loadSubcategories]);

    const handleCreate = async (data: CreateSubcategoryDto) => {
        setLoading(true);
        try {
            await subcategoryService.createSubcategory(data);
            await loadSubcategories();
        } catch (error) {
            console.error('Error creating subcategory:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateSubcategoryDto) => {
        setLoading(true);
        try {
            await subcategoryService.updateSubcategory(id, data);
            await loadSubcategories();
        } catch (error) {
            console.error('Error updating subcategory:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubcategory = async (id: number) => {
        setLoading(true);
        try {
            await subcategoryService.deleteSubcategory(id);
            await loadSubcategories();
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (subcategory: Subcategory) => {
        setSelectedItem(subcategory);
        setShowEditModal(true);
    };

    const handleDeleteClick = (subcategory: Subcategory) => {
        setSubcategoryToDelete(subcategory);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (subcategoryToDelete) {
            await handleDeleteSubcategory(subcategoryToDelete.id);
            setShowDeleteDialog(false);
            setSubcategoryToDelete(null);
        }
    };

    interface ColumnDef<T> {
        key: string;
        header: string;
        render?: (item: T) => React.ReactNode;
    }

    const columns: ColumnDef<Subcategory>[] = [
        {
            key: 'id',
            header: 'ID',
            render: (sub) => `#${sub.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (sub) => <div className="font-medium text-gray-900">{sub.nombre}</div>
        },
        {
            key: 'categoria',
            header: 'Categoría',
            render: (sub) => sub.categoria?.nombre || '-'
        },
        {
            key: 'prioridad',
            header: 'Prioridad Default',
            render: (sub) => sub.prioridad ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {sub.prioridad.nombre}
                </span>
            ) : '-'
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (sub) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${sub.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {sub.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (sub) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleEdit(sub)}
                        className="text-gray-400 hover:text-brand-blue"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        onClick={() => handleDeleteClick(sub)}
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
            placeholder: 'Buscar subcategorías...',
            value: searchQuery,
            onChange: (val) => setSearchQuery(val as string)
        },
        {
            type: 'select',
            name: 'categoria',
            value: categoryFilter,
            onChange: (val) => setCategoryFilter(val as number | 'all'),
            options: [
                { label: 'Todas las Categorías', value: 'all' },
                ...categories.map(c => ({ label: c.nombre, value: c.id }))
            ]
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
                    <h2 className="text-2xl font-bold text-gray-900">Subcategorías</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona las subcategorías y su relación con categorías y prioridades
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Subcategoría
                </Button>
            </div>

            {/* Modals */}
            <CreateSubcategoryModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditSubcategoryModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                subcategory={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setSubcategoryToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Subcategoría"
                message={`¿Estás seguro de que deseas eliminar la subcategoría "${subcategoryToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={subcategories}
                columns={columns as any} // Cast to any to avoid strict ColumnDef interface mismatch if present
                getRowKey={(sub) => sub.id}
                loading={loading}
                emptyMessage="No se encontraron subcategorías"
                loadingMessage="Cargando subcategorías..."
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
