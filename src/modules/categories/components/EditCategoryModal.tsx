import { useState, useEffect } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { departmentService } from '../../departments/services/department.service';
import { companyService } from '../../tickets/services/company.service';
import type { Department } from '../../departments/interfaces/Department';
import type { Company } from '../../tickets/interfaces/Company';
import type { Category, UpdateCategoryDto } from '../interfaces/Category';

export interface EditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: UpdateCategoryDto) => void | Promise<void>;
    category: Category | null;
}

export function EditCategoryModal({ isOpen, onClose, onSubmit, category }: EditCategoryModalProps) {
    const [formData, setFormData] = useState<UpdateCategoryDto>({
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

    // Cargar datos al abrir
    useEffect(() => {
        if (isOpen && category) {
            loadData();
            setFormData({
                nombre: category.nombre,
                estado: category.estado,
                // Mapear relaciones existentes a IDs
                departamentoIds: category.departamentos?.map(d => d.id) || [],
                empresaIds: category.empresas?.map(e => e.id) || []
            });
        }
    }, [isOpen, category]);

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

        if (!category) return;

        if (formData.departamentoIds?.length === 0) {
            setError('Debe seleccionar al menos un departamento');
            return;
        }

        if (formData.empresaIds?.length === 0) {
            setError('Debe seleccionar al menos una empresa');
            return;
        }

        setLoading(true);

        try {
            await onSubmit(category.id, formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const toggleDepartment = (deptId: number) => {
        setFormData(prev => {
            const currentIds = prev.departamentoIds || [];
            if (currentIds.includes(deptId)) {
                return { ...prev, departamentoIds: currentIds.filter(id => id !== deptId) };
            } else {
                return { ...prev, departamentoIds: [...currentIds, deptId] };
            }
        });
    };

    const toggleCompany = (companyId: number) => {
        setFormData(prev => {
            const currentIds = prev.empresaIds || [];
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
            title="Editar Categoría"
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
                    label="Nombre"
                    value={formData.nombre || ''}
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
                                                id={`edit-dept-${dept.id}`}
                                                checked={formData.departamentoIds?.includes(dept.id)}
                                                onChange={() => toggleDepartment(dept.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`edit-dept-${dept.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
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
                                                id={`edit-company-${company.id}`}
                                                checked={formData.empresaIds?.includes(company.id)}
                                                onChange={() => toggleCompany(company.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`edit-company-${company.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
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
                        id="edit-estado"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="edit-estado" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
