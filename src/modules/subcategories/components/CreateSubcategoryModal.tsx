import { useState, useEffect } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { categoryService } from '../../categories/services/category.service';
import { priorityService } from '../../tickets/services/priority.service';
import type { CreateSubcategoryDto } from '../interfaces/Subcategory';
import type { Category } from '../../categories/interfaces/Category';
import type { Priority } from '../../tickets/interfaces/Priority';

interface CreateSubcategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateSubcategoryDto) => Promise<void>;
}

export function CreateSubcategoryModal({ isOpen, onClose, onSubmit }: CreateSubcategoryModalProps) {
    const [formData, setFormData] = useState<CreateSubcategoryDto>({
        nombre: '',
        categoriaId: 0,
        prioridadId: undefined,
        descripcion: '',
        estado: 1
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        if (isOpen) {
            loadDependencies();
        }
    }, [isOpen]);

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
        setError(null);

        if (!formData.categoriaId) {
            setError('Debes seleccionar una categoría');
            return;
        }

        setLoading(true);

        try {
            await onSubmit(formData);
            setFormData({ nombre: '', categoriaId: 0, prioridadId: undefined, descripcion: '', estado: 1 });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear subcategoría');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ nombre: '', categoriaId: 0, prioridadId: undefined, descripcion: '', estado: 1 });
        setError(null);
        onClose();
    };



    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Crear Subcategoría"
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
                    label="Nombre de la Subcategoría"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Fallo de Hardware"
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
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:bg-gray-50"
                        value={formData.categoriaId}
                        onChange={(e) => setFormData({ ...formData, categoriaId: Number(e.target.value) })}
                        disabled={loading}
                        required
                    >
                        <option value={0}>Seleccione una categoría</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad por Defecto</label>
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:bg-gray-50"
                        value={formData.prioridadId || ''}
                        onChange={(e) => setFormData({ ...formData, prioridadId: e.target.value ? Number(e.target.value) : undefined })}
                        disabled={loading}
                    >
                        <option value="">Ninguna</option>
                        {priorities.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="estado"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="estado" className="text-sm font-medium text-gray-700">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
