import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { categoryService } from '../services/category.service';
import { departmentService } from '../../departments/services/department.service';
import { CreateCategoryModal } from '../components/CreateCategoryModal';
import { EditCategoryModal } from '../components/EditCategoryModal';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../interfaces/Category';
import type { Department } from '../../departments/interfaces/Department';
import { useLayout } from '../../../core/layout/context/LayoutContext';

/**
 * Página principal de gestión de categorías
 */
export default function CategoriesPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');
    const [departamentoFilter, setDepartamentoFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]); // Para el filtro
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Category | null>(null);

    useEffect(() => {
        setTitle('Gestión de Categorías');
    }, [setTitle]);

    // Cargar departamentos para el filtro
    useEffect(() => {
        departmentService.getAll({ estado: 1 }).then(response => setDepartments(response.data)).catch(console.error);
    }, []);

    // Función estable para cargar categorías
    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await categoryService.getAll({
                search: searchQuery,
                estado: estadoFilter,
                departamentoId: departamentoFilter,
                page,
                limit
            });
            setCategories(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, estadoFilter, departamentoFilter, page, limit]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, estadoFilter, departamentoFilter]);

    // Cargar al montar y cuando cambian los filtros (con debounce para search)
    useEffect(() => {
        const timer = setTimeout(() => {
            loadCategories();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [loadCategories, searchQuery]);

    const handleCreate = async (data: CreateCategoryDto) => {
        setLoading(true);
        try {
            await categoryService.create(data);
            await loadCategories();
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateCategoryDto) => {
        setLoading(true);
        try {
            await categoryService.update(id, data);
            await loadCategories();
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        setLoading(true);
        try {
            await categoryService.delete(id);
            await loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setSelectedItem(category);
        setShowEditModal(true);
    };

    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (categoryToDelete) {
            await handleDeleteCategory(categoryToDelete.id);
            setShowDeleteDialog(false);
            setCategoryToDelete(null);
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (cat: Category) => `#${cat.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (cat: Category) => cat.nombre
        },
        {
            key: 'departments',
            header: 'Departamentos',
            render: (cat: Category) => (
                <div className="flex flex-wrap gap-1">
                    {cat.departamentos?.map(dept => (
                        <span key={dept.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {dept.nombre}
                        </span>
                    )) || <span className="text-gray-400 text-xs">-</span>}
                </div>
            )
        },
        {
            key: 'companies',
            header: 'Empresas',
            render: (cat: Category) => (
                <div className="flex flex-wrap gap-1">
                    {cat.empresas?.map(company => (
                        <span key={company.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {company.nombre}
                        </span>
                    )) || <span className="text-gray-400 text-xs">-</span>}
                </div>
            )
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (cat: Category) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${cat.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {cat.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (cat: Category) => (
                <div className="flex gap-3">
                    <button
                        className="text-gray-400 hover:text-brand-blue"
                        onClick={() => handleEdit(cat)}
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteClick(cat)}
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
            placeholder: 'Buscar categorías...',
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
        },
        {
            type: 'select',
            name: 'departamento',
            value: departamentoFilter,
            onChange: (val) => setDepartamentoFilter(val as number | 'all'),
            options: [
                { label: 'Todos los Departamentos', value: 'all' },
                ...departments.map(d => ({ label: d.nombre, value: d.id }))
            ]
        }
    ];

    return (
        <>
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona las categorías de tickets y sus relaciones con departamentos y empresas
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Categoría
                </Button>
            </div>

            {/* Modals */}
            <CreateCategoryModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditCategoryModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                category={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setCategoryToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Categoría"
                message={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={categories}
                columns={columns}
                getRowKey={(cat) => cat.id}
                loading={loading}
                emptyMessage="No se encontraron categorías"
                loadingMessage="Cargando categorías..."
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
