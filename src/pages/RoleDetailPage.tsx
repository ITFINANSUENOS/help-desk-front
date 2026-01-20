
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { rbacService } from '../services/rbac.service';
import type { Role } from '../interfaces/Role';
import type { Permission } from '../interfaces/Permission';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InfoModal } from '../components/ui/InfoModal';

interface GroupedPermissions {
    [subject: string]: Permission[];
}

export default function RoleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const roleId = Number(id);

    const [role, setRole] = useState<Role | null>(null);
    const [allPermissions, setAllPermissions] = useState<GroupedPermissions>({});
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isNaN(roleId)) {
            navigate('/roles');
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                const [roleData, permList, rolePerms] = await Promise.all([
                    rbacService.getRole(roleId),
                    rbacService.getPermissions(),
                    rbacService.getRolePermissions(roleId)
                ]);

                setRole(roleData);
                setName(roleData.nombre);
                setDescription(roleData.descripcion);

                // Group permissions by subject
                const grouped = permList.reduce((acc, perm) => {
                    if (!acc[perm.subject]) acc[perm.subject] = [];
                    acc[perm.subject].push(perm);
                    return acc;
                }, {} as GroupedPermissions);
                setAllPermissions(grouped);

                // Set initially selected permissions
                setSelectedPermissions(new Set(rolePerms.map(p => p.id)));

            } catch (error) {
                console.error("Error loading role details:", error);
                // Handle error (e.g., role not found)
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [roleId, navigate]);

    const handlePermissionChange = (permId: number) => {
        const next = new Set(selectedPermissions);
        if (next.has(permId)) {
            next.delete(permId);
        } else {
            next.add(permId);
        }
        setSelectedPermissions(next);
    };

    const handleToggleGroup = (subjectObspermissions: Permission[]) => {
        const allIds = subjectObspermissions.map(p => p.id);
        const allSelected = allIds.every(id => selectedPermissions.has(id));

        const next = new Set(selectedPermissions);
        if (allSelected) {
            // Uncheck all
            allIds.forEach(id => next.delete(id));
        } else {
            // Check all
            allIds.forEach(id => next.add(id));
        }
        setSelectedPermissions(next);
    };

    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; variant: 'success' | 'error' | 'info'; onClose?: () => void }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const closeInfoModal = () => {
        setInfoModal(prev => ({ ...prev, isOpen: false }));
        if (infoModal.onClose) infoModal.onClose();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 1. Update basic info
            await rbacService.updateRole(roleId, { nombre: name, descripcion: description });

            // 2. Update permissions
            await rbacService.assignPermissions(roleId, Array.from(selectedPermissions));

            setInfoModal({
                isOpen: true,
                title: 'Éxito',
                message: 'Rol actualizado correctamente',
                variant: 'success',
                onClose: () => navigate('/roles')
            });
        } catch (error) {
            console.error("Error saving role:", error);
            setInfoModal({
                isOpen: true,
                title: 'Error',
                message: 'Ocurrió un error al guardar los cambios',
                variant: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-10">Cargando...</div>
            </DashboardLayout>
        );
    }

    if (!role) {
        return (
            <DashboardLayout>
                <div className="text-center p-10">Rol no encontrado</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Editar Rol: {role.nombre}</h2>
                    <p className="text-gray-500">Configura los detalles y permisos del rol.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/roles')}>
                        Cancelar
                    </Button>
                    <Button variant="brand" onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-gray-800">Datos Generales</h3>
                        <div className="space-y-4">
                            <Input
                                label="Nombre del Rol"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Descripción</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Permission Matrix */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-gray-800">Matriz de Permisos</h3>
                        <div className="space-y-6">
                            {Object.entries(allPermissions).map(([subject, perms]) => (
                                <div key={subject} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="text-lg font-semibold text-brand-blue">{subject}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleGroup(perms)}
                                            className="text-xs text-brand-teal hover:underline"
                                        >
                                            Seleccionar todos
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {perms.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${selectedPermissions.has(perm.id) ? 'border-brand-teal bg-cyan-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                                                    checked={selectedPermissions.has(perm.id)}
                                                    onChange={() => handlePermissionChange(perm.id)}
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{perm.nombre} <span className="text-xs text-gray-500 font-normal">({perm.action})</span></div>
                                                    <div className="text-xs text-gray-500">{perm.descripcion}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {Object.keys(allPermissions).length === 0 && (
                                <p className="text-center text-gray-500 py-8">No hay permisos definidos en el sistema.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <InfoModal
                isOpen={infoModal.isOpen}
                onClose={closeInfoModal}
                title={infoModal.title}
                message={infoModal.message}
                variant={infoModal.variant}
            />
        </DashboardLayout >
    );
}
