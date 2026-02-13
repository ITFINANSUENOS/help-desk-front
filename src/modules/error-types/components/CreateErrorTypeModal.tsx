import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { errorTypeService } from '../services/error-type.service';
import type { CreateErrorTypeDto, CreateErrorSubtypeDto } from '../interfaces/ErrorType';

interface CreateErrorTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateErrorTypeModal: React.FC<CreateErrorTypeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Parent Form State
    const [formData, setFormData] = useState<CreateErrorTypeDto>({
        title: '',
        description: '',
        category: 1,
        isActive: true
    });

    // Subtypes State
    const [subtypes, setSubtypes] = useState<Partial<CreateErrorSubtypeDto>[]>([]);
    const [newSubtype, setNewSubtype] = useState<Partial<CreateErrorSubtypeDto>>({ title: '', description: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'isActive' ? value === 'true' : value
        }));
    };

    const handleAddSubtype = () => {
        if (!newSubtype.title) return;
        setSubtypes([...subtypes, { ...newSubtype, isActive: true }]);
        setNewSubtype({ title: '', description: '' });
    };

    const handleRemoveSubtype = (index: number) => {
        setSubtypes(subtypes.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create Parent (Error Type)
            const createdErrorType = await errorTypeService.createErrorType({
                ...formData,
                category: Number(formData.category)
            });

            // 2. Create Subtypes sequentially
            if (createdErrorType.id && subtypes.length > 0) {
                for (const subtype of subtypes) {
                    if (subtype.title) {
                        await errorTypeService.createSubtype({
                            errorTypeId: createdErrorType.id,
                            title: subtype.title,
                            description: subtype.description || '',
                            isActive: true
                        });
                    }
                }
            }

            // Reset and Close
            setFormData({ title: '', description: '', category: 1, isActive: true });
            setSubtypes([]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating error type:', err);
            setError('Error al crear el tipo de error y sus subtipos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Tipo de Error">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                            value={formData.title}
                            onChange={handleChange}
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none"
                            placeholder="Ej: Falla de Internet"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none resize-none"
                            placeholder="Descripción del problema..."
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
                        <span className="text-xs text-gray-500">{subtypes.length} agregados</span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    placeholder="Título del subtipo"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-blue outline-none"
                                    value={newSubtype.title}
                                    onChange={(e) => setNewSubtype({ ...newSubtype, title: e.target.value })}
                                />
                            </div>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    placeholder="Descripción (opcional)"
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

                        {/* List of added subtypes */}
                        {subtypes.length > 0 && (
                            <ul className="space-y-2 mt-2">
                                {subtypes.map((st, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-white p-2 border border-gray-200 rounded shadow-sm">
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-800">{st.title}</span>
                                            {st.description && <span className="text-gray-500 ml-2">- {st.description}</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubtype(idx)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
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
