import { useState, useEffect } from 'react';
import type { User, CreateUserDto, UpdateUserDto } from '../interfaces/User';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { userService } from '../services/user.service';
import { rbacService } from '../../roles/services/rbac.service';
import { departmentService, positionService, regionService } from '../../../shared/services/catalog.service';
import type { Role } from '../../roles/interfaces/Role';
import type { Department, Position, Region } from '../../../shared/interfaces/Catalog';

interface UserFormProps {
    user?: User;
    onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
    const [formData, setFormData] = useState({
        cedula: user?.cedula || '',
        nombre: user?.nombre || '',
        apellido: user?.apellido || '',
        email: user?.email || '',
        password: '',
        rolId: user?.rolId || 0,
        regionalId: user?.regionalId || 0,
        cargoId: user?.cargoId || 0,
        departamentoId: user?.departamentoId || 0,
        esNacional: user?.esNacional || false,
        estado: user?.estado ?? 1
    });

    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [rolesData, deptsData, posData, regsData] = await Promise.all([
                    rbacService.getRoles(),
                    departmentService.getAllActive(),
                    positionService.getAllActive(),
                    regionService.getAllActive()
                ]);
                setRoles(rolesData);
                setDepartments(deptsData);
                setPositions(posData);
                setRegions(regsData);
            } catch (error) {
                console.error("Error loading catalogs:", error);
            }
        };
        loadCatalogs();
    }, []);

    // Sync formData when user prop changes from parent (fetch fresh data)
    useEffect(() => {
        if (user) {
            // Fetch fresh user data to ensure we have all relations (role, regional, etc.)
            userService.getUser(user.id)
                .then(freshUser => {
                    setFormData({
                        cedula: freshUser.cedula || '',
                        nombre: freshUser.nombre || '',
                        apellido: freshUser.apellido || '',
                        email: freshUser.email || '',
                        password: '',
                        rolId: freshUser.rolId || freshUser.role?.id || 0,
                        regionalId: freshUser.regionalId || freshUser.regional?.id || 0,
                        cargoId: freshUser.cargoId || freshUser.cargo?.id || 0,
                        departamentoId: freshUser.departamentoId || freshUser.departamento?.id || 0,
                        esNacional: freshUser.esNacional || false,
                        estado: freshUser.estado ?? 1
                    });
                })
                .catch(err => {
                    console.error("Error loading user details", err);
                    // Fallback to prop data if fetch fails
                    setFormData({
                        cedula: user.cedula || '',
                        nombre: user.nombre || '',
                        apellido: user.apellido || '',
                        email: user.email || '',
                        password: '',
                        rolId: user.rolId || user.role?.id || 0,
                        regionalId: user.regionalId || user.regional?.id || 0,
                        cargoId: user.cargoId || user.cargo?.id || 0,
                        departamentoId: user.departamentoId || user.departamento?.id || 0,
                        esNacional: user.esNacional || false,
                        estado: user.estado ?? 1
                    });
                });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (name: string, value: string | number | undefined) => {
        setFormData(prev => ({
            ...prev,
            [name]: value !== undefined ? Number(value) : 0
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.cedula.trim()) newErrors.cedula = 'Cédula es requerida';
        if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es requerido';
        if (!formData.apellido.trim()) newErrors.apellido = 'Apellido es requerido';
        if (!formData.email.trim()) newErrors.email = 'Email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!user && !formData.password) {
            newErrors.password = 'Contraseña es requerida';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
        }

        if (!formData.rolId || formData.rolId === 0) {
            newErrors.rolId = 'Rol es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const submitData: CreateUserDto | UpdateUserDto = {
            cedula: formData.cedula,
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            rolId: formData.rolId,
            regionalId: formData.regionalId || undefined,
            cargoId: formData.cargoId || undefined,
            departamentoId: formData.departamentoId || undefined,
            esNacional: formData.esNacional
        };

        if (formData.password) {
            submitData.password = formData.password;
        }

        if (user) {
            (submitData as UpdateUserDto).estado = formData.estado;
        }

        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Cédula */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cédula <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleChange}
                        className={`w-full rounded-lg border ${errors.cedula ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-brand-teal focus:ring-brand-teal`}
                    />
                    {errors.cedula && <p className="mt-1 text-xs text-red-500">{errors.cedula}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-brand-teal focus:ring-brand-teal`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className={`w-full rounded-lg border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-brand-teal focus:ring-brand-teal`}
                    />
                    {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
                </div>

                {/* Apellido */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        className={`w-full rounded-lg border ${errors.apellido ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-brand-teal focus:ring-brand-teal`}
                    />
                    {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido}</p>}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña {!user && <span className="text-red-500">*</span>}
                        {user && <span className="text-gray-500 text-xs ml-1">(dejar vacío para no cambiar)</span>}
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-brand-teal focus:ring-brand-teal`}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Rol */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol <span className="text-red-500">*</span>
                    </label>
                    <Select
                        name="rolId"
                        value={formData.rolId}
                        onChange={(val) => handleSelectChange('rolId', val)}
                        options={roles.map(role => ({ value: role.id, label: role.nombre }))}
                        placeholder="Seleccione un rol"
                        error={errors.rolId}
                    />
                    {errors.rolId && <p className="mt-1 text-xs text-red-500">{errors.rolId}</p>}
                </div>

                {/* Regional */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Regional
                    </label>
                    <Select
                        name="regionalId"
                        value={formData.regionalId}
                        onChange={(val) => handleSelectChange('regionalId', val)}
                        options={regions.map(region => ({ value: region.id, label: region.nombre }))}
                        placeholder="Sin regional"
                    />
                </div>

                {/* Cargo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo
                    </label>
                    <Select
                        name="cargoId"
                        value={formData.cargoId}
                        onChange={(val) => handleSelectChange('cargoId', val)}
                        options={positions.map(position => ({ value: position.id, label: position.nombre }))}
                        placeholder="Sin cargo"
                    />
                </div>

                {/* Departamento */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento
                    </label>
                    <Select
                        name="departamentoId"
                        value={formData.departamentoId}
                        onChange={(val) => handleSelectChange('departamentoId', val)}
                        options={departments.map(dept => ({ value: dept.id, label: dept.nombre }))}
                        placeholder="Sin departamento"
                    />
                </div>

                {/* Es Nacional */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="esNacional"
                        checked={formData.esNacional}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                        Usuario Nacional
                    </label>
                </div>

                {/* Estado (only for edit) */}
                {user && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <Select
                            name="estado"
                            value={formData.estado}
                            onChange={(val) => handleSelectChange('estado', val)}
                            options={[
                                { value: 1, label: 'Activo' },
                                { value: 0, label: 'Inactivo' }
                            ]}
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" variant="brand" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
                </Button>
            </div>
        </form>
    );
}
