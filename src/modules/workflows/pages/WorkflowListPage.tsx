import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { workflowService } from '../services/workflow.service';
import type { Workflow } from '../interfaces/Workflow';
import { WorkflowModal } from '../components/WorkflowModal';
import { toast } from 'sonner';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';

export default function WorkflowListPage() {
    const { setTitle } = useLayout();
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

    // Configuración de paginación y filtros
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

    useEffect(() => {
        setTitle('Gestión de Flujos de Trabajo');
    }, [setTitle]);

    const fetchWorkflows = useCallback(async () => {
        setLoading(true);
        try {
            const response = await workflowService.getWorkflows({
                page,
                limit,
                search: searchQuery,
                estado: estadoFilter
            });
            setWorkflows(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar flujos');
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchQuery, estadoFilter]);

    // Debounce for search or filter change
    useEffect(() => {
        // Reset page only if filters change, but handled by state setters logic mostly.
        // Simplification: just fetch.
        const timer = setTimeout(() => {
            fetchWorkflows();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchWorkflows]); // fetchWorkflows dependency already includes filters

    const handleCreate = () => {
        setSelectedWorkflow(null);
        setModalOpen(true);
    };

    const handleEdit = (wf: Workflow) => {
        setSelectedWorkflow(wf);
        setModalOpen(true);
    };

    const handleDeleteClick = (wf: Workflow) => {
        setWorkflowToDelete(wf);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!workflowToDelete) return;
        try {
            await workflowService.deleteWorkflow(workflowToDelete.id);
            toast.success('Flujo eliminado');
            fetchWorkflows();
            setShowDeleteDialog(false);
            setWorkflowToDelete(null);
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // Columnas de la tabla
    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (wf: Workflow) => `#${wf.id} `
        },

        {
            key: 'subcategoria',
            header: 'Subcategoría',
            render: (wf: Workflow) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {wf.subcategoria?.nombre || 'Sin asignar'}
                </span>
            )
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (wf: Workflow) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${wf.estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {wf.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (wf: Workflow) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleEdit(wf)}
                        className="text-gray-400 hover:text-brand-blue"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        onClick={() => navigate(`/workflows/${wf.id}/steps`)}
                        className="text-gray-400 hover:text-brand-teal"
                        title="Gestionar Pasos"
                    >
                        <span className="material-symbols-outlined text-[20px]">account_tree</span>
                    </button>
                    <button
                        onClick={() => handleDeleteClick(wf)}
                        className="text-gray-400 hover:text-red-600"
                        title="Eliminar"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            )
        }
    ];

    // Configuración de filtro
    const filterConfig: FilterConfig[] = [
        {
            type: 'search',
            name: 'search',
            placeholder: 'Buscar flujo...',
            value: searchQuery,
            onChange: (val) => {
                setSearchQuery(val as string);
                setPage(1);
            }
        },
        {
            type: 'select',
            name: 'estado',
            value: estadoFilter,
            onChange: (val) => {
                setEstadoFilter(val as number | 'all');
                setPage(1);
            },
            options: [
                { label: 'Todos', value: 'all' },
                { label: 'Activo', value: 1 },
                { label: 'Inactivo', value: 0 }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Flujos de Trabajo</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra los procesos y estados de los tickets.
                    </p>
                </div>
                <Button variant="brand" onClick={handleCreate}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Nuevo Flujo
                </Button>
            </div>

            <FilterBar filters={filterConfig} className="mb-6" />

            <DataTable
                data={workflows}
                columns={columns}
                getRowKey={(wf) => wf.id}
                loading={loading}
                pagination={{
                    page,
                    limit,
                    total,
                    totalPages,
                    onPageChange: setPage
                }}
            />

            <WorkflowModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchWorkflows}
                workflow={selectedWorkflow}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Eliminar Flujo"
                message={`¿Estás seguro de que deseas eliminar el flujo "${workflowToDelete?.nombre}" ? `}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
}
