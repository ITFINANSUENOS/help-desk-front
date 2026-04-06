import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import type { StepTemplateField, TemplateField } from '../interfaces/TemplateField';
import { FIELD_TYPES } from '../interfaces/TemplateField';
import { toast } from 'sonner';
import { Icon } from '../../../shared/components/Icon';

interface TemplateFieldsConfigProps {
    campos: StepTemplateField[];
    onChange: (campos: StepTemplateField[]) => void;
    flujoId: number;
    /** Available template fields from the selected template */
    templateFields?: TemplateField[];
    /** ID of the selected template (for creating new template fields) */
    flujoPlantillaId?: number;
    /** Callback to create a new template field */
    onCreateTemplateField?: (data: { campoNombre: string; campoCodigo: string; campoTipo?: string }) => Promise<void>;
}

/**
 * Template fields configuration for a step.
 * Now references TemplateField zones (coordinates configured at template level).
 */
export const TemplateFieldsConfig = ({ campos, onChange, templateFields = [], flujoPlantillaId, onCreateTemplateField }: TemplateFieldsConfigProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldCode, setNewFieldCode] = useState('');
    const [newFieldTipo, setNewFieldTipo] = useState('text');
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm<StepTemplateField>();

    const watchedPlantillaCampoId = watch('plantillaCampoId');

    const onSubmit = (data: StepTemplateField) => {
        const newCampo: StepTemplateField = {
            ...data,
            plantillaCampoId: data.plantillaCampoId ? Number(data.plantillaCampoId) : undefined,
        };

        if (editingIndex !== null) {
            const updated = [...campos];
            updated[editingIndex] = newCampo;
            onChange(updated);
            setEditingIndex(null);
            toast.success('Campo actualizado');
        } else {
            onChange([...campos, newCampo]);
            toast.success('Campo agregado');
        }

        reset();
        setIsAdding(false);
    };

    const handleEdit = (index: number) => {
        const campo = campos[index];
        setEditingIndex(index);
        setValue('plantillaCampoId', campo.plantillaCampoId);
        setValue('nombre', campo.nombre);
        setValue('codigo', campo.codigo);
        setValue('tipo', campo.tipo);
        setIsAdding(true);
    };

    const handleDelete = (index: number) => {
        if (editingIndex === index) {
            setIsAdding(false);
            setEditingIndex(null);
            reset();
        }
        const updated = [...campos];
        updated.splice(index, 1);
        onChange(updated);
        toast.success('Campo eliminado');
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingIndex(null);
        reset();
    };

    const handleTemplateFieldSelect = (plantillaCampoId: number) => {
        const templateField = templateFields.find(tf => tf.id === plantillaCampoId);
        if (templateField) {
            setValue('nombre', templateField.nombre);
            setValue('codigo', templateField.codigo);
            setValue('tipo', templateField.tipo);
        }
    };

    const getTemplateFieldDisplay = (campo: StepTemplateField) => {
        if (!campo.plantillaCampoId) return 'Sin campo asignado';
        const field = templateFields.find(tf => tf.id === campo.plantillaCampoId);
        if (!field) return `Campo #${campo.plantillaCampoId}`;
        return `${field.nombre} (${field.codigo}) - Pág ${field.pagina}`;
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700">Campos de Plantilla</h4>
                {!isAdding && (
                    <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                        <Icon name="add" className="mr-1 text-[18px]" />
                        Agregar Campo
                    </Button>
                )}
            </div>

            {campos.length === 0 && !isAdding && (
                <p className="text-sm text-gray-500 italic text-center py-4">
                    No hay campos de plantilla configurados.
                </p>
            )}

            {/* Lista de campos existentes */}
            {campos.length > 0 && (
                <div className="space-y-2 mb-4">
                    {campos.map((campo, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between bg-white p-3 rounded border ${
                                editingIndex === index ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                    {campo.nombre || getTemplateFieldDisplay(campo)}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    Código: {campo.codigo || 'N/A'} | Tipo: {campo.tipo || 'N/A'}
                                </p>
                            </div>
                            <div className="flex gap-2 ml-2">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(index)}
                                    className="text-gray-400 hover:text-brand-blue"
                                    title="Editar"
                                >
                                    <Icon name="edit" className="text-[20px]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(index)}
                                    className="text-gray-400 hover:text-red-600"
                                    title="Eliminar"
                                >
                                    <Icon name="delete" className="text-[20px]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar/editar */}
            {isAdding && (
                <div className="bg-white p-4 rounded border border-blue-200 space-y-3 shadow-md">
                    <h5 className="text-xs font-bold uppercase text-blue-600 flex justify-between items-center">
                        {editingIndex !== null ? 'Editar Campo' : 'Nuevo Campo'}
                    </h5>

                    {templateFields.length > 0 ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Campo de Plantilla
                            </label>
                            <select
                                {...register('plantillaCampoId', { required: true })}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setValue('plantillaCampoId', val);
                                    handleTemplateFieldSelect(val);
                                }}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                                value={watchedPlantillaCampoId || ''}
                            >
                                <option value="">Seleccione un campo...</option>
                                {templateFields.map(tf => (
                                    <option key={tf.id} value={tf.id}>
                                        {tf.nombre} ({tf.codigo}) - Pág {tf.pagina}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Seleccione un campo configurado en la plantilla PDF
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-700">
                                No hay campos de plantilla disponibles para esta empresa.
                            </div>
                            {flujoPlantillaId && onCreateTemplateField && (
                                <div className="border border-dashed border-yellow-300 rounded p-3 bg-yellow-50/50">
                                    <p className="text-xs text-yellow-700 mb-2 font-medium">¿Desea crear un campo de plantilla?</p>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre"
                                            value={newFieldName}
                                            onChange={(e) => setNewFieldName(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Código"
                                            value={newFieldCode}
                                            onChange={(e) => setNewFieldCode(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm"
                                        />
                                        <select
                                            value={newFieldTipo}
                                            onChange={(e) => setNewFieldTipo(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm"
                                        >
                                            {FIELD_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="brand"
                                        disabled={isSaving || !newFieldName || !newFieldCode}
                                        onClick={async () => {
                                            setIsSaving(true);
                                            try {
                                                await onCreateTemplateField({
                                                    campoNombre: newFieldName,
                                                    campoCodigo: newFieldCode,
                                                    campoTipo: newFieldTipo,
                                                });
                                                setNewFieldName('');
                                                setNewFieldCode('');
                                                setNewFieldTipo('text');
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                    >
                                        {isSaving ? 'Creando...' : 'Crear Campo'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                {...register('nombre')}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                                placeholder="Ej. Cédula"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                            <input
                                {...register('codigo')}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                                placeholder="Ej. cedula"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            {...register('tipo')}
                            className="w-full border rounded px-2 py-1.5 text-sm"
                        >
                            {FIELD_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="brand"
                            onClick={handleSubmit(onSubmit)}
                            disabled={!watchedPlantillaCampoId}
                        >
                            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
