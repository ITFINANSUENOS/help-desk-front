import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import type { StepTemplateField } from '../interfaces/TemplateField';
import { FIELD_TYPES } from '../interfaces/TemplateField';
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';

interface TemplateFieldsConfigProps {
    campos: StepTemplateField[];
    onChange: (campos: StepTemplateField[]) => void;
}

export const TemplateFieldsConfig = ({ campos, onChange }: TemplateFieldsConfigProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const { register, handleSubmit, reset } = useForm<StepTemplateField>();

    // Filter only active campos (estado = 1)
    const activeCampos = campos.filter(campo => campo.estado === 1 || campo.estado === undefined);

    const handleAdd = (data: StepTemplateField) => {
        const newCampo: StepTemplateField = {
            ...data,
            coordX: Number(data.coordX),
            coordY: Number(data.coordY),
            pagina: Number(data.pagina),
            fontSize: Number(data.fontSize) || 10,
            campoTrigger: data.campoTrigger ? 1 : 0,
            mostrarDiasTranscurridos: !!data.mostrarDiasTranscurridos,
            estado: 1, // Always set as active
        };

        if (editingIndex !== null) {
            const updated = [...campos];
            updated[editingIndex] = newCampo;
            onChange(updated);
            setEditingIndex(null);
        } else {
            onChange([...campos, newCampo]);
        }

        reset();
        setIsAdding(false);
    };

    const handleEdit = (index: number) => {
        // Find the actual campo in the full list
        const campo = activeCampos[index];
        reset(campo);
        // Find the index in the full campos array
        const actualIndex = campos.findIndex(c => c === campo);
        setEditingIndex(actualIndex);
        setIsAdding(true);
    };

    const handleDelete = (index: number) => {
        // Soft delete: set estado to 0 instead of removing
        const campo = activeCampos[index];
        const actualIndex = campos.findIndex(c => c === campo);
        const updated = [...campos];
        updated[actualIndex] = { ...updated[actualIndex], estado: 0 };
        onChange(updated);
    };

    const handleCancel = () => {
        reset();
        setIsAdding(false);
        setEditingIndex(null);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700">Campos de Plantilla</h4>
                {!isAdding && (
                    <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                        <IconPlus size={16} className="mr-1" />
                        Agregar Campo
                    </Button>
                )}
            </div>

            {/* Lista de campos existentes */}
            {activeCampos.length > 0 && (
                <div className="space-y-2 mb-4">
                    {activeCampos.map((campo, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                            <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{campo.nombre}</p>
                                <p className="text-xs text-gray-500">
                                    Código: {campo.codigo} | Tipo: {campo.tipo} | Pág: {campo.pagina} | X: {campo.coordX}, Y: {campo.coordY}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(index)}
                                    className="text-gray-400 hover:text-brand-blue"
                                >
                                    <IconEdit size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(index)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <IconTrash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar/editar */}
            {isAdding && (
                <form onSubmit={handleSubmit(handleAdd)} className="bg-white p-4 rounded border border-gray-300 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Nombre"
                            {...register('nombre', { required: true })}
                            placeholder="Ej. Cédula"
                        />
                        <Input
                            label="Código"
                            {...register('codigo', { required: true })}
                            placeholder="Ej. cedula"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Tipo</label>
                            <select
                                {...register('tipo', { required: true })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                {FIELD_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Página"
                            type="number"
                            {...register('pagina', { required: true })}
                            placeholder="1"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Input
                            label="Coord X"
                            type="number"
                            step="0.01"
                            {...register('coordX', { required: true })}
                            placeholder="0.00"
                        />
                        <Input
                            label="Coord Y"
                            type="number"
                            step="0.01"
                            {...register('coordY', { required: true })}
                            placeholder="0.00"
                        />
                        <Input
                            label="Font Size"
                            type="number"
                            {...register('fontSize')}
                            placeholder="10"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Campo Query (Opcional)</label>
                        <textarea
                            {...register('campoQuery')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            rows={2}
                            placeholder="Ej. EXCEL:2:cedula o PRESET_FECHA_ACTUAL"
                        />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('campoTrigger')}
                                className="rounded text-brand-teal focus:ring-brand-teal"
                            />
                            <span className="text-sm text-gray-700">Campo Trigger</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('mostrarDiasTranscurridos')}
                                className="rounded text-brand-teal focus:ring-brand-teal"
                            />
                            <span className="text-sm text-gray-700">Mostrar Días Transcurridos</span>
                        </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" variant="brand">
                            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};
