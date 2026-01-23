
import { useEffect, useState } from 'react';
import { rbacService } from '../services/rbac.service';
import type { Permission } from '../interfaces/Permission';
import { PERMISSION_SUBJECTS, PERMISSION_ACTIONS } from '../interfaces/Permission';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';
import { InfoModal } from '../../../shared/components/InfoModal';
import { Input } from '../../../shared/components/Input';
import { useLayout } from '../../../core/layout/context/LayoutContext';

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { setTitle } = useLayout();

    // Form state
    const [nombre, setNombre] = useState('');
    const [subject, setSubject] = useState('');
    const [action, setAction] = useState('read');
    const [description, setDescription] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        setTitle('Gestión de Roles');
    }, [setTitle]);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const data = await rbacService.getPermissions();
            setPermissions(data);
        } catch (error) {
            console.error("Error fetching permissions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; variant: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const handleCreatePermission = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await rbacService.createPermission({ nombre, subject, action, descripcion: description });
            await fetchPermissions();
            setIsCreateModalOpen(false);
            // Reset form
            setNombre('');
            setSubject('');
            setAction('read');
            setDescription('');
            setInfoModal({
                isOpen: true,
                title: 'Éxito',
                message: 'Permiso creado correctamente',
                variant: 'success'
            });
        } catch (error) {
            console.error("Error creating permission:", error);
            setInfoModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al crear permiso. Verifique los datos.',
                variant: 'error'
            });
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
            await rbacService.deletePermission(confirmDeleteId);
            setPermissions(permissions.filter(p => p.id !== confirmDeleteId));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting permission:", error);
            // Here we could also show an error modal instead of console.error
        }
    };

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Catálogo de Permisos</h2>
                    <p className="text-gray-500">Definiciones técnicas de permisos (Solo para desarrolladores/admin).</p>
                </div>
                <Button variant="brand" onClick={() => setIsCreateModalOpen(true)}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Nuevo Permiso
                </Button>
            </div>

            {/* Permissions Table */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Recurso (Subject)</th>
                                <th className="px-6 py-4">Acción (Action)</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Cargando permisos...
                                    </td>
                                </tr>
                            ) : permissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No hay permisos definidos.
                                    </td>
                                </tr>
                            ) : (
                                permissions.map((perm) => (
                                    <tr key={perm.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">#{perm.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{perm.nombre}</td>
                                        <td className="px-6 py-4 text-gray-600">{perm.subject}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${perm.action === 'delete' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                perm.action === 'update' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                    perm.action === 'create' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                        perm.action === 'manage' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                            'bg-blue-50 text-blue-700 ring-blue-700/10'
                                                }`}>
                                                {perm.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{perm.descripcion}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteClick(perm.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Eliminar Definición"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Permission Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nueva Definición de Permiso"
            >
                <form onSubmit={handleCreatePermission} className="space-y-4">
                    <Input
                        label="Nombre"
                        placeholder="Ej. users:read"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Subject (Recurso)</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        >
                            {PERMISSION_SUBJECTS.map((subj) => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Entidad sobre la que aplica el permiso.</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Action (Acción)</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                        >
                            {PERMISSION_ACTIONS.map((act) => (
                                <option key={act} value={act}>{act}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Descripción"
                        placeholder="Ej. Puede ver el listado de productos"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <div className="flex justify-end gap-3 pt-4">
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
                            {formLoading ? 'Guardando...' : 'Crear Definición'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Permiso"
                message="¿Estás seguro de que deseas eliminar este permiso? Esta acción podría afectar a los roles que lo tienen asignado."
                confirmText="Eliminar"
                variant="danger"
            />

            <InfoModal
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
                title={infoModal.title}
                message={infoModal.message}
                variant={infoModal.variant}
            />
        </>
    );
}
