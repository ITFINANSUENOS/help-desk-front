import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { mappingRuleService } from '../services/mapping-rule.service';
import { subcategoryService } from '../../subcategories/services/subcategory.service';
import { CreateMappingRuleModal } from '../components/CreateMappingRuleModal';
import { EditMappingRuleModal } from '../components/EditMappingRuleModal';
import type { MappingRule, CreateMappingRuleDto, UpdateMappingRuleDto } from '../interfaces/MappingRule';
import type { Subcategory } from '../../subcategories/interfaces/Subcategory';
import { useLayout } from '../../../core/layout/context/LayoutContext';

/**
 * Página principal de gestión de reglas de mapeo
 */
export default function MappingRulesPage() {
    const { setTitle } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<MappingRule | null>(null);

    // Filtros & Paginación
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<number | 'all'>('all');
    const [subcategoriaFilter, setSubcategoriaFilter] = useState<number | 'all'>('all');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Datos
    const [rules, setRules] = useState<MappingRule[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MappingRule | null>(null);

    useEffect(() => {
        setTitle('Gestión de Reglas de Mapeo');
    }, [setTitle]);

    // Cargar subcategorías para el filtro
    useEffect(() => {
        subcategoryService.getAll().then(setSubcategories).catch(console.error);
    }, []);

    // Función estable para cargar reglas
    const loadRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await mappingRuleService.getAll({
                search: searchQuery,
                estado: estadoFilter,
                subcategoriaId: subcategoriaFilter,
                page,
                limit
            });
            setRules(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Error loading mapping rules:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, estadoFilter, subcategoriaFilter, page, limit]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, estadoFilter, subcategoriaFilter]);

    // Cargar al montar y cuando cambian los filtros (con debounce para search)
    useEffect(() => {
        const timer = setTimeout(() => {
            loadRules();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [loadRules, searchQuery]);

    const handleCreate = async (data: CreateMappingRuleDto) => {
        setLoading(true);
        try {
            await mappingRuleService.create(data);
            await loadRules();
        } catch (error) {
            console.error('Error creating mapping rule:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateMappingRuleDto) => {
        setLoading(true);
        try {
            await mappingRuleService.update(id, data);
            await loadRules();
        } catch (error) {
            console.error('Error updating mapping rule:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRule = async (id: number) => {
        setLoading(true);
        try {
            await mappingRuleService.delete(id);
            await loadRules();
        } catch (error) {
            console.error('Error deleting mapping rule:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule: MappingRule) => {
        setSelectedItem(rule);
        setShowEditModal(true);
    };

    const handleDeleteClick = (rule: MappingRule) => {
        setRuleToDelete(rule);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (ruleToDelete) {
            await handleDeleteRule(ruleToDelete.id);
            setShowDeleteDialog(false);
            setRuleToDelete(null);
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            render: (rule: MappingRule) => `#${rule.id}`
        },
        {
            key: 'subcategoria',
            header: 'Subcategoría',
            render: (rule: MappingRule) => (
                <div>
                    <div className="font-medium text-gray-900">{rule.subcategoria?.nombre || '-'}</div>
                    {rule.subcategoria?.categoria && (
                        <div className="text-xs text-gray-500">{rule.subcategoria.categoria.nombre}</div>
                    )}
                </div>
            )
        },
        {
            key: 'creadores',
            header: 'Creadores',
            render: (rule: MappingRule) => (
                <div className="flex flex-wrap gap-1">
                    {rule.creadores?.map(c => (
                        <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {c.cargo?.nombre || `Cargo #${c.creadorCargoId}`}
                        </span>
                    ))}
                    {rule.creadoresPerfil?.map(cp => (
                        <span key={cp.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {cp.perfil?.nombre || `Perfil #${cp.creadorPerfilId}`}
                        </span>
                    ))}
                    {(!rule.creadores || rule.creadores.length === 0) && (!rule.creadoresPerfil || rule.creadoresPerfil.length === 0) && (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                </div>
            )
        },
        {
            key: 'asignados',
            header: 'Asignados',
            render: (rule: MappingRule) => (
                <div className="flex flex-wrap gap-1">
                    {rule.asignados?.map(a => (
                        <span key={a.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {a.cargo?.nombre || `Cargo #${a.asignadoCargoId}`}
                        </span>
                    )) || <span className="text-gray-400 text-xs">-</span>}
                </div>
            )
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (rule: MappingRule) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${rule.estado === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                `}>
                    {rule.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (rule: MappingRule) => (
                <div className="flex gap-3">
                    <button
                        className="text-gray-400 hover:text-brand-blue"
                        onClick={() => handleEdit(rule)}
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteClick(rule)}
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
            placeholder: 'Buscar reglas...',
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
            name: 'subcategoria',
            value: subcategoriaFilter,
            onChange: (val) => setSubcategoriaFilter(val as number | 'all'),
            options: [
                { label: 'Todas las Subcategorías', value: 'all' },
                ...subcategories.map(s => ({ label: s.nombre, value: s.id }))
            ]
        }
    ];

    return (
        <>
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reglas de Mapeo</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestiona las reglas de asignación automática según subcategoría
                    </p>
                </div>
                <Button
                    variant="brand"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Regla
                </Button>
            </div>

            {/* Modals */}
            <CreateMappingRuleModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
            />

            <EditMappingRuleModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdate}
                rule={selectedItem}
            />

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setRuleToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar Regla de Mapeo"
                message={`¿Estás seguro de que deseas eliminar la regla para "${ruleToDelete?.subcategoria?.nombre}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable
                data={rules}
                columns={columns}
                getRowKey={(rule) => rule.id}
                loading={loading}
                emptyMessage="No se encontraron reglas de mapeo"
                loadingMessage="Cargando reglas..."
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
