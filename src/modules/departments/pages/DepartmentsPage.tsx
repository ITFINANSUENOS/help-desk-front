import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { departmentService } from '../services/department.service';
import { CreateDepartmentModal } from '../components/CreateDepartmentModal';
import { EditDepartmentModal } from '../components/EditDepartmentModal';
import type { Department, CreateDepartmentDto, UpdateDepartmentDto } from '../interfaces/Department';
import { useLayout } from '../../../core/layout/context/LayoutContext';

/**
 * Página principal de gestión de departamentos
 */
export default function DepartmentsPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Department | null>(null);

    useEffect(() => {
        setTitle('Gestión de Departamentos');
    }, [setTitle]);

    // Función estable para cargar departamentos
    const loadDepartments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await departmentService.getAll({
                search: searchQuery,
                estado: estadoFilter,
                page,
                limit
            });
            setDepartments(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading departments:', error);
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
            loadDepartments();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, loadDepartments]);

    const handleCreate = async (data: CreateDepartmentDto) => {
        setLoading(true);
        try {
            await departmentService.create(data);
            await loadDepartments();
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateDepartmentDto) => {
        setLoading(true);
        try {
            await departmentService.update(id, data);
            await loadDepartments();
        } catch (error) {
            console.error('Error updating department:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDept = async (id: number) => {
        setLoading(true);
        try {
            await departmentService.delete(id);
            await loadDepartments();
        } catch (error) {
            console.error('Error deleting department:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (department: Department) => {
        setSelectedItem(department);
        setShowEditModal(true);
    };

    const handleDeleteClick = (department: Department) => {
        setDepartmentToDelete(department);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (departmentToDelete) {
            await handleDeleteDept(departmentToDelete.id);
            setShowDeleteDialog(false);
            setDepartmentToDelete(null);
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (dept: Department) => `#${dept.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (dept: Department) => dept.nombre
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (dept: Department) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${dept.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {dept.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (dept: Department) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleEdit(dept)}
                        className="text-gray-400 hover:text-brand-blue"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        onClick={() => handleDeleteClick(dept)}
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
            placeholder: 'Buscar departamentos...',
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
                    <h2 className="text-2xl font-bold text-gray-900">Departamentos</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona los departamentos de la organización
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Departamento
                </Button>
            </div>

            <CreateDepartmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditDepartmentModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                department={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setDepartmentToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Departamento"
                message={`¿Estás seguro de que deseas eliminar el departamento "${departmentToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={departments}
                columns={columns}
                getRowKey={(dept) => dept.id}
                loading={loading}
                emptyMessage="No se encontraron departamentos"
                loadingMessage="Cargando departamentos..."
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
