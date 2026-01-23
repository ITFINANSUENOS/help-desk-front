import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { companyService } from '../services/company.service';
import { CreateCompanyModal } from '../components/CreateCompanyModal';
import { EditCompanyModal } from '../components/EditCompanyModal';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../interfaces/Company';
import { useLayout } from '../../../core/layout/context/LayoutContext';

/**
 * Página principal de gestión de empresas
 */
export default function CompaniesPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Company | null>(null);

    useEffect(() => {
        setTitle('Gestión de Roles');
    }, [setTitle]);

    // Función estable para cargar empresas
    const loadCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const response = await companyService.getCompanies({
                search: searchQuery,
                estado: estadoFilter,
                page,
                limit
            });
            setCompanies(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading companies:', error);
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
            loadCompanies();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, loadCompanies]);

    const handleCreate = async (data: CreateCompanyDto) => {
        setLoading(true);
        try {
            await companyService.createCompany(data);
            await loadCompanies();
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateCompanyDto) => {
        setLoading(true);
        try {
            await companyService.updateCompany(id, data);
            await loadCompanies();
        } catch (error) {
            console.error('Error updating company:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCompany = async (id: number) => {
        setLoading(true);
        try {
            await companyService.deleteCompany(id);
            await loadCompanies();
        } catch (error) {
            console.error('Error deleting company:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (company: Company) => {
        setSelectedItem(company);
        setShowEditModal(true);
    };

    const handleDeleteClick = (company: Company) => {
        setCompanyToDelete(company);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (companyToDelete) {
            await handleDeleteCompany(companyToDelete.id);
            setShowDeleteDialog(false);
            setCompanyToDelete(null);
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (comp: Company) => `#${comp.id}`
        },
        {
            key: 'nombre',
            header: 'Nombre',
            render: (comp: Company) => comp.nombre
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (comp: Company) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${comp.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {comp.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (comp: Company) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleEdit(comp)}
                        className="text-gray-400 hover:text-brand-blue"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        onClick={() => handleDeleteClick(comp)}
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
            placeholder: 'Buscar empresas...',
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
                    <h2 className="text-2xl font-bold text-gray-900">Empresas</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona las empresas / entidades de la organización
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Empresa
                </Button>
            </div>

            {/* Modals */}
            <CreateCompanyModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditCompanyModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                company={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setCompanyToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Empresa"
                message={`¿Estás seguro de que deseas eliminar la empresa "${companyToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={companies}
                columns={columns}
                getRowKey={(comp) => comp.id}
                loading={loading}
                emptyMessage="No se encontraron empresas"
                loadingMessage="Cargando empresas..."
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
