import { useEffect, useState } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { categoryService } from '../../categories/services/category.service';
import { subcategoryService } from '../services/subcategory.service';
import { priorityService } from '../../tickets/services/priority.service';
import type { Subcategory, UpdateSubcategoryDto } from '../interfaces/Subcategory';
import type { Category } from '../../categories/interfaces/Category';
import type { Priority } from '../../tickets/interfaces/Priority';

interface EditSubcategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: UpdateSubcategoryDto) => Promise<void>;
    subcategory: Subcategory | null;
}

export function EditSubcategoryModal({ isOpen, onClose, onSubmit, subcategory }: EditSubcategoryModalProps) {
    const [formData, setFormData] = useState<UpdateSubcategoryDto>({
        nombre: '',
        categoriaId: undefined,
        prioridadId: undefined,
        descripcion: '',
        estado: 1
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadDependencies();
        }
    }, [isOpen]);

    // Sync formData when subcategory prop changes from parent (fetch fresh data)
    useEffect(() => {
        if (subcategory) {
            // Fetch fresh data
            subcategoryService.getSubcategory(subcategory.id)
                .then(freshSub => {
                    setFormData({
                        nombre: freshSub.nombre,
                        categoriaId: freshSub.categoriaId || freshSub.categoria?.id || undefined,
                        prioridadId: freshSub.prioridadId || freshSub.prioridad?.id || undefined,
                        descripcion: freshSub.descripcion || '',
                        estado: freshSub.estado
                    });
                })
                .catch(err => {
                    console.error("Error loading subcategory details", err);
                    // Fallback to prop
                    setFormData({
                        nombre: subcategory.nombre,
                        categoriaId: subcategory.categoriaId || subcategory.categoria?.id || undefined,
                        prioridadId: subcategory.prioridadId || subcategory.prioridad?.id || undefined,
                        descripcion: subcategory.descripcion || '',
                        estado: subcategory.estado
                    });
                });
        }
    }, [subcategory]);

    const loadDependencies = async () => {
        try {
            const [catsResponse, prios] = await Promise.all([
                categoryService.getAll({ limit: 1000 }),
                priorityService.getPriorities()
            ]);
            setCategories(catsResponse.data);
            setPriorities(prios);
        } catch (err) {
            console.error('Error loading dependencies:', err);
            setError('Error al cargar categorías o prioridades');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subcategory) return;

        setError(null);
        setLoading(true);

        try {
            await onSubmit(subcategory.id, formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar subcategoría');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Editar Subcategoría"
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
                    label="Nombre de la Subcategoría"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    disabled={loading}
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    <div className="overflow-hidden rounded-md border border-gray-300 bg-white">
                        <ReactQuill
                            theme="snow"
                            value={formData.descripcion || ''}
                            onChange={(value) => setFormData({ ...formData, descripcion: value })}
                            className="[&_.ql-container]:min-h-[100px] [&_.ql-editor]:min-h-[100px] text-sm"
                            placeholder="Descripción opcional"
                            readOnly={loading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <Select
                        value={formData.categoriaId}
                        onChange={(val) => setFormData({ ...formData, categoriaId: Number(val) })}
                        options={categories.map(cat => ({ value: cat.id, label: cat.nombre }))}
                        placeholder="Seleccione una categoría"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad por Defecto</label>
                    <Select
                        value={formData.prioridadId}
                        onChange={(val) => setFormData({ ...formData, prioridadId: val ? Number(val) : undefined })}
                        options={priorities.map(p => ({ value: p.id, label: p.nombre }))}
                        placeholder="Ninguna"
                        disabled={loading}
                        isClearable
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="edit-estado-sub"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="edit-estado-sub" className="text-sm font-medium text-gray-700">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
