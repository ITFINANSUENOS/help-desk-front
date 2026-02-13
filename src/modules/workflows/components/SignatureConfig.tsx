import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';

import type { StepSignature } from '../interfaces/Step';
import type { Position } from '../../../shared/interfaces/Catalog';
import { toast } from 'sonner';

interface SignatureConfigProps {
    firmas: StepSignature[];
    onChange: (firmas: StepSignature[]) => void;
    positions: Position[];
}

export const SignatureConfig = ({ firmas, onChange, positions }: SignatureConfigProps) => {
    // Local state for the form being added
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const { register, handleSubmit, reset, setValue, control } = useForm<StepSignature>();

    const onSubmit = (data: StepSignature) => {
        const newFirma = {
            ...data,
            coordX: Number(data.coordX) || 0,
            coordY: Number(data.coordY) || 0,

            pagina: Number(data.pagina),
            cargoId: data.cargoId ? Number(data.cargoId) : undefined,
            usuarioId: undefined
        };

        if (editingIndex !== null) {
            // Update existing
            const newFirmas = [...firmas];
            newFirmas[editingIndex] = newFirma;
            onChange(newFirmas);
            setEditingIndex(null);
            toast.success('Zona actualizada');
        } else {
            // Add new
            onChange([...firmas, newFirma]);
            toast.success('Zona agregada');
        }

        reset();
        setIsAdding(false);
    };

    const handleEdit = (index: number) => {
        const firma = firmas[index];
        setEditingIndex(index);

        setValue('etiqueta', firma.etiqueta || '');
        setValue('pagina', firma.pagina);
        setValue('coordX', firma.coordX);
        setValue('coordY', firma.coordY);
        setValue('cargoId', firma.cargoId);

        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingIndex(null);
        reset();
    };

    const handleRemove = (index: number) => {
        if (editingIndex === index) handleCancel();
        const newFirmas = [...firmas];
        newFirmas.splice(index, 1);
        onChange(newFirmas);
    };


    return (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">Zonas de Firma</h4>
                {!isAdding && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditingIndex(null); reset(); setIsAdding(true); }}>
                        <span className="material-symbols-outlined mr-1 text-[18px]">add</span>
                        Agregar Zona
                    </Button>
                )}
            </div>

            {firmas.length === 0 && !isAdding && (
                <p className="text-sm text-gray-500 italic text-center py-2">
                    No hay firmas configuradas.
                </p>
            )}

            <div className="space-y-2">
                {firmas.map((firma, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-2 rounded border text-sm ${editingIndex === idx ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200'}`}>
                        <div className="flex-1 grid grid-cols-5 gap-2 items-center">
                            <span>
                                <span className="font-medium">Pág:</span> {firma.pagina}
                            </span>
                            <span>
                                <span className="font-medium">X:</span> {firma.coordX}
                            </span>
                            <span>
                                <span className="font-medium">Y:</span> {firma.coordY}
                            </span>
                            {firma.etiqueta && (
                                <span className="col-span-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded truncate" title="Smart Tag">
                                    🏷️ {firma.etiqueta}
                                </span>
                            )}
                            <span className="truncate col-span-2">
                                {firma.cargoId
                                    ? positions.find(p => p.id === firma.cargoId)?.nombre
                                    : 'Cualquiera'}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => handleEdit(idx)}
                                className="text-gray-400 hover:text-brand-blue"
                                title="Editar configuración"
                            >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="text-gray-400 hover:text-red-600"
                                title="Eliminar"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="bg-white p-3 rounded border border-blue-200 space-y-3 shadow-md">
                    <h5 className="text-xs font-bold uppercase text-blue-600 flex justify-between items-center">
                        {editingIndex !== null ? 'Editar Zona' : 'Nueva Zona'}
                    </h5>
                    <div className="space-y-3">
                        <div>
                            <Input
                                label="Etiqueta PDF (Smart Tag)"
                                {...register('etiqueta')}
                                placeholder="Ej. FIRMA_GERENTE"
                            />
                            <p className="text-xs text-gray-500 mt-1">Etiqueta en el PDF para ubicar la firma automáticamente</p>
                        </div>

                        <Input
                            label="Página"
                            type="number"
                            {...register('pagina', { required: true, min: 1 })}
                            placeholder="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargo (Opcional)</label>
                        <Controller
                            name="cargoId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={[
                                        { value: '', label: '-- Cualquiera --' },
                                        ...positions.map(p => ({ value: p.id, label: p.nombre }))
                                    ]}
                                    onChange={(val) => field.onChange(val)}
                                    placeholder="-- Seleccionar --"
                                />
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>Cancelar</Button>
                        <Button type="button" size="sm" variant="brand" onClick={handleSubmit(onSubmit)}>
                            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
