
import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { tagService, type Tag } from '../services/tag.service';
import { ticketService } from '../services/ticket.service';
import { Icon } from '../../../shared/components/Icon';

interface TagManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId?: number | null;
    currentTags?: { id: number; name: string; color: string }[];
    onTagAssigned?: () => void;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

export default function TagManagementModal({ isOpen, onClose, ticketId, currentTags, onTagAssigned }: TagManagementModalProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');

    // Form fields (shared for create & edit)
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState('#3B82F6');
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    // Inline delete confirmation
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadTags();
            resetView();
        }
    }, [isOpen]);

    const resetView = () => {
        setView('list');
        setFormName('');
        setFormColor('#3B82F6');
        setEditingTag(null);
        setDeletingId(null);
    };

    const loadTags = async () => {
        try {
            setLoading(true);
            const data = await tagService.getMyTags();
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load tags', error);
        } finally {
            setLoading(false);
        }
    };

    /** Assign / unassign tag to the current ticket */
    const handleToggleTag = async (tag: Tag) => {
        if (!ticketId) return;
        try {
            const isAssigned = currentTags?.some(t => t.id === tag.id);
            if (isAssigned) {
                await ticketService.removeTag(ticketId, tag.id);
            } else {
                await ticketService.addTag(ticketId, tag.id);
            }
            if (onTagAssigned) onTagAssigned();
            onClose();
        } catch (error) {
            console.error('Failed to toggle tag', error);
        }
    };

    /** Open the create form */
    const openCreate = () => {
        setFormName('');
        setFormColor('#3B82F6');
        setEditingTag(null);
        setView('create');
    };

    /** Open the edit form pre-filled with tag data */
    const openEdit = (tag: Tag) => {
        setEditingTag(tag);
        setFormName(tag.nombre);
        setFormColor(tag.color);
        setView('edit');
    };

    /** Save create or edit */
    const handleSave = async () => {
        if (!formName.trim()) return;
        try {
            setLoading(true);
            if (view === 'edit' && editingTag) {
                await tagService.updateTag(editingTag.id, { nombre: formName, color: formColor });
            } else {
                await tagService.createTag({ nombre: formName, color: formColor });
            }
            resetView();
            loadTags();
        } catch (error) {
            console.error('Failed to save tag', error);
        } finally {
            setLoading(false);
        }
    };

    /** Confirm + delete */
    const handleDelete = async (id: number) => {
        try {
            setLoading(true);
            await tagService.deleteTag(id);
            setDeletingId(null);
            loadTags();
        } catch (error) {
            console.error('Failed to delete tag', error);
        } finally {
            setLoading(false);
        }
    };

    const modalTitle =
        view === 'create' ? 'Nueva Etiqueta' :
            view === 'edit' ? 'Editar Etiqueta' :
                ticketId ? 'Gestionar Etiquetas' : 'Mis Etiquetas';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-md">
            <div className="space-y-4">

                {/* ───── LIST VIEW ───── */}
                {view === 'list' && (
                    <>
                        <div className="min-h-[140px]">
                            {loading && tags.length === 0 ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
                                </div>
                            ) : tags.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 gap-2">
                                    <Icon name="label_off" className="text-gray-300 text-4xl" />
                                    <p className="text-gray-400 text-sm">No tienes etiquetas creadas.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {tags.map(tag => {
                                        const isAssigned = ticketId && currentTags?.some(t => t.id === tag.id);
                                        const isConfirmingDelete = deletingId === tag.id;

                                        return (
                                            <li key={tag.id} className="flex items-center gap-3 py-2.5 px-1">
                                                {/* Color dot + name */}
                                                <button
                                                    type="button"
                                                    onClick={() => ticketId ? handleToggleTag(tag) : undefined}
                                                    disabled={!ticketId}
                                                    className={`flex-1 flex items-center gap-2 min-w-0 text-left rounded-lg px-2 py-1 transition-colors
                                                        ${ticketId ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    <span
                                                        className="shrink-0 w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: tag.color }}
                                                    />
                                                    <span className="text-sm font-medium text-gray-800 truncate">{tag.nombre}</span>
                                                    {isAssigned && (
                                                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                                                            <Icon name="check" className="text-[13px]" />
                                                            Asignada
                                                        </span>
                                                    )}
                                                </button>

                                                {/* Actions */}
                                                {isConfirmingDelete ? (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="text-xs text-red-600 font-medium mr-1">¿Eliminar?</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(tag.id)}
                                                            disabled={loading}
                                                            className="p-1 rounded text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors px-2"
                                                        >
                                                            Sí
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingId(null)}
                                                            className="p-1 rounded text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors px-2"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(tag)}
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                                                            title="Editar etiqueta"
                                                        >
                                                            <Icon name="edit" className="text-[16px]" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingId(tag.id)}
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Eliminar etiqueta"
                                                        >
                                                            <Icon name="delete" className="text-[16px]" />
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-gray-100">
                            <Button variant="brand" onClick={openCreate} className="w-full sm:w-auto">
                                <Icon name="add" className="mr-2 text-sm" />
                                Nueva Etiqueta
                            </Button>
                        </div>
                    </>
                )}

                {/* ───── CREATE / EDIT FORM ───── */}
                {(view === 'create' || view === 'edit') && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                        <Input
                            label="Nombre de la etiqueta"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="Ej. Urgente"
                            autoFocus
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div className="grid grid-cols-8 gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormColor(color)}
                                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue
                                            ${formColor === color ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        {formName && (
                            <div className="p-4 bg-gray-50 rounded-lg flex justify-center items-center">
                                <div
                                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border"
                                    style={{ backgroundColor: formColor + '15', color: formColor, borderColor: formColor + '30' }}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: formColor }} />
                                    {formName}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                            <Button variant="ghost" onClick={resetView} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button
                                variant="brand"
                                onClick={handleSave}
                                disabled={!formName.trim() || loading}
                            >
                                {loading ? 'Guardando...' : view === 'edit' ? 'Actualizar' : 'Crear'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
