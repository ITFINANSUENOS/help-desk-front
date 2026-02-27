import { useState, useEffect } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select, type Option } from '../../../shared/components/Select';
import type { Department, UpdateDepartmentDto } from '../interfaces/Department';
import { departmentService } from '../services/department.service';
import { userService } from '../../users/services/user.service';

export interface EditDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: UpdateDepartmentDto) => void | Promise<void>;
    department: Department | null;
}

export function EditDepartmentModal({
    isOpen,
    onClose,
    onSubmit,
    department
}: EditDepartmentModalProps) {
    const [formData, setFormData] = useState<UpdateDepartmentDto>({
        nombre: '',
        estado: 1,
        jefeId: undefined
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<Option[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoadingUsers(true);
            userService.getUsers({ limit: 500 })
                .then(response => {
                    const userOptions: Option[] = response.data.map(user => ({
                        value: user.id,
                        label: `${user.nombre} ${user.apellido || ''}`.trim()
                    }));
                    setUsers(userOptions);
                })
                .catch(err => console.error('Error loading users:', err))
                .finally(() => setLoadingUsers(false));
        }
    }, [isOpen]);

    useEffect(() => {
        if (department && isOpen) {
            departmentService.getById(department.id)
                .then(dept => {
                    setFormData({
                        nombre: dept.nombre,
                        estado: dept.estado,
                        jefeId: dept.jefeId ?? undefined
                    });
                })
                .catch(err => {
                    console.error("Error loading department", err);
                    setFormData({
                        nombre: department.nombre,
                        estado: department.estado,
                        jefeId: (department as any).jefeId ?? undefined
                    });
                });
        }
    }, [department, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!department) return;

        setError(null);
        setLoading(true);

        try {
            await onSubmit(department.id, {
                ...formData,
                jefeId: formData.jefeId ?? null
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar departamento');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    if (!department) return null;

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Editar Departamento"
            submitText="Guardar Cambios"
            loading={loading}
            size="md"
        >
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <Input
                    label="Nombre del Departamento"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Sistemas, Recursos Humanos"
                    required
                    disabled={loading}
                />

                <Select
                    label="Jefe del Departamento"
                    value={formData.jefeId ?? ''}
                    onChange={(val) => setFormData({ ...formData, jefeId: val as number | undefined })}
                    options={users}
                    placeholder={loadingUsers ? 'Cargando usuarios...' : 'Seleccionar jefe...'}
                    disabled={loading || loadingUsers}
                    isClearable
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="estado-edit"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="estado-edit" className="text-sm font-medium text-gray-700">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
