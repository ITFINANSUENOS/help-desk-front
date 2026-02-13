import React, { useEffect, useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { errorTypeService } from '../services/error-type.service';
import type { ErrorType, UpdateErrorTypeDto, ErrorSubtype, CreateErrorSubtypeDto } from '../interfaces/ErrorType';

interface EditErrorTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    errorType: ErrorType | null;
}

export const EditErrorTypeModal: React.FC<EditErrorTypeModalProps> = ({ isOpen, onClose, onSuccess, errorType }) => {
    const [formData, setFormData] = useState<UpdateErrorTypeDto>({
        title: '',
        description: '',
        category: 1,
        isActive: true
    });

    // Subtypes State
    const [subtypes, setSubtypes] = useState<ErrorSubtype[]>([]); // Current list (mix of existing and new)
    const [originalSubtypes, setOriginalSubtypes] = useState<ErrorSubtype[]>([]); // To track deletions
    const [newSubtype, setNewSubtype] = useState<Partial<CreateErrorSubtypeDto>>({ title: '', description: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (errorType) {
            setFormData({
                title: errorType.title,
                description: errorType.description,
                category: errorType.category,
                isActive: errorType.isActive
            });
            loadSubtypes(errorType.id);
        }
    }, [errorType]);

    const loadSubtypes = async (id: number) => {
        try {
            const data = await errorTypeService.getSubtypes(id);
            setSubtypes(data);
            setOriginalSubtypes(data); // clone for diffing
        } catch (err) {
            console.error('Error loading subtypes', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'isActive' ? value === 'true' : value
        }));
    };

    // Subtype Handlers
    const handleAddSubtype = () => {
        if (!newSubtype.title) return;
        // Temporary ID negative for new items to distinguish
        const tempId = - Date.now();
        const newItem: any = {
            id: tempId,
            title: newSubtype.title,
            description: newSubtype.description || '',
            isActive: true,
            errorTypeId: errorType?.id
        };
        setSubtypes([...subtypes, newItem]);
        setNewSubtype({ title: '', description: '' });
    };

    const handleRemoveSubtype = (index: number) => {
        setSubtypes(subtypes.filter((_, i) => i !== index));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!errorType) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Update Parent
            await errorTypeService.updateErrorType(errorType.id, {
                ...formData,
                category: Number(formData.category)
            });

            // 2. Process Subtypes Diff
            const promises = [];

            // A. Create New (Negative IDs)
            const toCreate = subtypes.filter(s => s.id < 0);
            for (const item of toCreate) {
                promises.push(errorTypeService.createSubtype({
                    errorTypeId: errorType.id,
                    title: item.title,
                    description: item.description,
                    isActive: true
                }));
            }

            // B. Delete Removed (In Original but not in Current)
            const currentIds = new Set(subtypes.map(s => s.id));
            const toDelete = originalSubtypes.filter(s => !currentIds.has(s.id));
            for (const item of toDelete) {
                promises.push(errorTypeService.deleteSubtype(item.id));
            }
            // Note: Update existing subtypes logic could be added here if full edit (title/desc) was allowed

            await Promise.all(promises);

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating error type:', err);
            setError('Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Tipo de Error">
            <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Parent Fields */}
                <div className="space-y-4 border-b border-gray-100 pb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Información General</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título
                        </label>
                        <input
                            name="title"
                            value={formData.title || ''}
                            onChange={handleChange}
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            required
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría
                            </label>
                            <Select
                                value={formData.category}
                                onChange={(val) => setFormData(prev => ({ ...prev, category: Number(val) }))}
                                options={[
                                    { value: 1, label: 'Error de Proceso' },
                                    { value: 0, label: 'Informativo' }
                                ]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <Select
                                value={formData.isActive ? 'true' : 'false'}
                                onChange={(val) => setFormData(prev => ({ ...prev, isActive: val === 'true' }))}
                                options={[
                                    { value: 'true', label: 'Activo' },
                                    { value: 'false', label: 'Inactivo' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Subtypes Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Subtipos</h3>
                        <span className="text-xs text-gray-500">{subtypes.length} total</span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    placeholder="Nuevo subtipo..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-blue outline-none"
                                    value={newSubtype.title}
                                    onChange={(e) => setNewSubtype({ ...newSubtype, title: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtype())}
                                />
                            </div>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    placeholder="Descripción..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-blue outline-none"
                                    value={newSubtype.description}
                                    onChange={(e) => setNewSubtype({ ...newSubtype, description: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-full"
                                    onClick={handleAddSubtype}
                                    disabled={!newSubtype.title}
                                >
                                    Agregar
                                </Button>
                            </div>
                        </div>

                        {/* List of subtypes */}
                        {subtypes.length > 0 && (
                            <ul className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                                {subtypes.map((st, idx) => (
                                    <li key={st.id || idx} className="flex justify-between items-center bg-white p-2 border border-gray-200 rounded shadow-sm">
                                        <div className="text-sm overflow-hidden">
                                            <div className="font-medium text-gray-800 truncate">{st.title}</div>
                                            {st.description && <div className="text-xs text-gray-500 truncate">{st.description}</div>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {st.id < 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Nuevo</span>}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubtype(idx)}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="brand" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
