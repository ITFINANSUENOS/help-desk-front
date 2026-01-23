import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { DataTable } from '../../../shared/components/DataTable';
import { userService } from '../services/user.service';
import type { User } from '../interfaces/User';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';
import { useLayout } from '../../../core/layout/context/LayoutContext';

export default function UsersPage() {
    const { setTitle } = useLayout();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');

    useEffect(() => {
        setTitle('Gestión de Roles');
    }, [setTitle]);

    // Filter configuration
    const filterConfig: FilterConfig[] = [
        {
            type: 'search',
            name: 'search',
            placeholder: 'Buscar por nombre, email o cédula...',
            value: searchQuery,
            onChange: (value) => setSearchQuery(value as string)
        },
        {
            type: 'select',
            name: 'role',
            value: roleFilter,
            onChange: (value) => setRoleFilter(value as number | 'all'),
            options: [
                { label: 'Todos los Roles', value: 'all' },
                { label: 'Super Admin', value: 1 },
                { label: 'Agente', value: 2 },
                { label: 'Usuario', value: 3 }
            ]
        },
        {
            type: 'select',
            name: 'status',
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as number | 'all'),
            options: [
                { label: 'Todos los Estados', value: 'all' },
                { label: 'Activos', value: 1 },
                { label: 'Inactivos', value: 0 }
            ]
        }
    ];

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers({
                page,
                limit,
                search: searchQuery,
                rolId: roleFilter,
                estado: statusFilter
            });
            setUsers(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchQuery, roleFilter, statusFilter]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, roleFilter, statusFilter]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchUsers]);

    const handleDelete = async () => {
        if (!deletingUser) return;
        try {
            await userService.deleteUser(deletingUser.id);
            setDeletingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
                    <p className="mt-1 text-sm text-gray-500">Administra los usuarios del sistema</p>
                </div>
                <Button variant="brand" onClick={() => setIsCreateModalOpen(true)}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Usuario
                </Button>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchUsers}
            />

            <EditUserModal
                isOpen={!!editingUser}
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSuccess={fetchUsers}
            />

            <ConfirmationModal
                isOpen={!!deletingUser}
                title="Eliminar Usuario"
                message={`¿Estás seguro de que deseas eliminar al usuario ${deletingUser?.nombre} ${deletingUser?.apellido}?`}
                onConfirm={handleDelete}
                onClose={() => setDeletingUser(null)}
            />

            {/* Filters */}
            <FilterBar filters={filterConfig} className="mb-6" />

            {/* Table */}
            <DataTable<User>
                columns={[
                    {
                        key: 'nombre',
                        header: 'Nombre',
                        render: (user: User) => (
                            <div>
                                <div className="font-medium text-gray-900">{user.nombre} {user.apellido}</div>
                                <div className="text-xs text-gray-500">CC: {user.cedula}</div>
                            </div>
                        )
                    },
                    {
                        key: 'email',
                        header: 'Contacto',
                        render: (user: User) => <div>{user.email}</div>
                    },
                    {
                        key: 'role',
                        header: 'Rol / Cargo',
                        render: (user: User) => (
                            <div>
                                <div className="font-medium">{user.role?.nombre || '-'}</div>
                                <div className="text-xs text-gray-500">{user.cargo?.nombre || '-'}</div>
                            </div>
                        )
                    },
                    {
                        key: 'regional',
                        header: 'Ubicación',
                        render: (user: User) => (
                            <div>
                                <div>{user.regional?.nombre || '-'}</div>
                                <div className="text-xs text-gray-500">{user.departamento?.nombre || '-'}</div>
                            </div>
                        )
                    },
                    {
                        key: 'estado',
                        header: 'Estado',
                        render: (user: User) => (
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.estado === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {user.estado === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'Acciones',
                        className: 'px-6 py-4 text-right',
                        render: (user: User) => (
                            <div className="flex justify-end gap-2">
                                <button
                                    className="text-gray-400 hover:text-brand-blue"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingUser(user);
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                    className="text-gray-400 hover:text-red-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingUser(user);
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        )
                    }
                ]}
                data={users}
                loading={loading}
                emptyMessage="No se encontraron usuarios."
                loadingMessage="Cargando usuarios..."
                getRowKey={(user: User) => user.id}
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
