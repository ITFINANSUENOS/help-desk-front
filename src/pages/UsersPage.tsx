import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { FilterBar, type FilterConfig } from '../components/ui/FilterBar';
import { userService } from '../services/user.service';
import type { User } from '../interfaces/User';
import { CreateUserModal } from '../components/users/CreateUserModal';
import { EditUserModal } from '../components/users/EditUserModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

export default function UsersPage() {
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
        <DashboardLayout title="Gestión de Usuarios">
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
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Role / Position</th>
                                <th className="px-6 py-4">Locations</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center">No users found.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{user.nombre} {user.apellido}</div>
                                            <div className="text-xs text-gray-500">CC: {user.cedula}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{user.rol?.nombre || '-'}</div>
                                            <div className="text-xs text-gray-500">{user.cargo?.nombre || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>{user.regional?.nombre || '-'}</div>
                                            <div className="text-xs text-gray-500">{user.departamento?.nombre || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.estado === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.estado === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="text-gray-400 hover:text-brand-blue mr-2"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-600"
                                                onClick={() => setDeletingUser(user)}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium text-gray-900">{total === 0 ? 0 : (page - 1) * limit + 1}</span> a <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span> de <span className="font-medium text-gray-900">{total}</span> resultados
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >Anterior</button>
                        <button
                            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >Siguiente</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
