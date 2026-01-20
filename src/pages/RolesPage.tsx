
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { rbacService } from '../services/rbac.service';
import type { Role } from '../interfaces/Role';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Input } from '../components/ui/Input';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const data = await rbacService.getRoles();
            setRoles(data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await rbacService.createRole({ nombre: newRoleName, descripcion: newRoleDesc });
            await fetchRoles();
            setIsCreateModalOpen(false);
            setNewRoleName('');
            setNewRoleDesc('');
        } catch (error) {
            console.error("Error creating role:", error);
        } finally {
            setFormLoading(false);
        }
    };

    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const handleDeleteClick = (id: number) => {
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await rbacService.deleteRole(confirmDeleteId);
            setRoles(roles.filter(r => r.id !== confirmDeleteId));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting role:", error);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Roles</h2>
                    <p className="text-gray-500">Administra los roles y sus permisos.</p>
                </div>
                <Button variant="brand" onClick={() => setIsCreateModalOpen(true)}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Nuevo Rol
                </Button>
            </div>

            {/* Roles Table */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Nombre / ID</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Cargando roles...
                                    </td>
                                </tr>
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No hay roles creados.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{role.nombre}</div>
                                            <div className="text-xs text-gray-400">ID: {role.id}</div>
                                        </td>
                                        <td className="px-6 py-4">{role.descripcion}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role.estado === 1 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {role.estado === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/roles/${role.id}`}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded text-brand-blue hover:bg-blue-50 transition-colors"
                                                    title="Editar y Permisos"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(role.id)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Role Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Crear Nuevo Rol"
            >
                <form onSubmit={handleCreateRole} className="space-y-4">
                    <Input
                        label="Nombre del Rol"
                        placeholder="Ej. Administrador"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                    />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
                            placeholder="Describe las responsabilidades..."
                            value={newRoleDesc}
                            onChange={(e) => setNewRoleDesc(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="brand"
                            disabled={formLoading}
                        >
                            {formLoading ? 'Guardando...' : 'Crear Role'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Rol"
                message="¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
            />
        </DashboardLayout>
    );
}
