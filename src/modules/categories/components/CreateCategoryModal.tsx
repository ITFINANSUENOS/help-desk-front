import { useState, useEffect } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { departmentService } from '../../departments/services/department.service';
import { companyService } from '../../tickets/services/company.service';
import type { Department } from '../../departments/interfaces/Department';
import type { Company } from '../../tickets/interfaces/Company';
import type { CreateCategoryDto } from '../interfaces/Category';

export interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCategoryDto) => void | Promise<void>;
}

export function CreateCategoryModal({ isOpen, onClose, onSubmit }: CreateCategoryModalProps) {
    const [formData, setFormData] = useState<CreateCategoryDto>({
        nombre: '',
        estado: 1,
        departamentoIds: [],
        empresaIds: []
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar departamentos y empresas
    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            const [departmentsResponse, companiesData] = await Promise.all([
                departmentService.getAll({ estado: 1 }),
                companyService.getCompanies()
            ]);
            setDepartments(departmentsResponse.data);
            setCompanies(companiesData);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error al cargar datos auxiliares');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.departamentoIds.length === 0) {
            setError('Debe seleccionar al menos un departamento');
            return;
        }

        if (formData.empresaIds.length === 0) {
            setError('Debe seleccionar al menos una empresa');
            return;
        }

        setLoading(true);

        try {
            await onSubmit(formData);
            setFormData({ nombre: '', estado: 1, departamentoIds: [], empresaIds: [] });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ nombre: '', estado: 1, departamentoIds: [], empresaIds: [] });
        setError(null);
        onClose();
    };

    const toggleDepartment = (deptId: number) => {
        setFormData(prev => {
            const currentIds = prev.departamentoIds;
            if (currentIds.includes(deptId)) {
                return { ...prev, departamentoIds: currentIds.filter(id => id !== deptId) };
            } else {
                return { ...prev, departamentoIds: [...currentIds, deptId] };
            }
        });
    };

    const toggleCompany = (companyId: number) => {
        setFormData(prev => {
            const currentIds = prev.empresaIds;
            if (currentIds.includes(companyId)) {
                return { ...prev, empresaIds: currentIds.filter(id => id !== companyId) };
            } else {
                return { ...prev, empresaIds: [...currentIds, companyId] };
            }
        });
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Crear Categoría"
            submitText="Crear"
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
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre de la categoría"
                    required
                    disabled={loading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Departamentos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departamentos <span className="text-red-500">*</span>
                        </label>

                        {loadingData ? (
                            <div className="text-sm text-gray-500">Cargando...</div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                                {departments.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay departamentos disponibles</p>
                                ) : (
                                    departments.map(dept => (
                                        <div key={dept.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                id={`dept-${dept.id}`}
                                                checked={formData.departamentoIds.includes(dept.id)}
                                                onChange={() => toggleDepartment(dept.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`dept-${dept.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
                                                {dept.nombre}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Empresas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Empresas <span className="text-red-500">*</span>
                        </label>

                        {loadingData ? (
                            <div className="text-sm text-gray-500">Cargando...</div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                                {companies.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay empresas disponibles</p>
                                ) : (
                                    companies.map(company => (
                                        <div key={company.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                id={`company-${company.id}`}
                                                checked={formData.empresaIds.includes(company.id)}
                                                onChange={() => toggleCompany(company.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`company-${company.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
                                                {company.nombre}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="estado"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="estado" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
