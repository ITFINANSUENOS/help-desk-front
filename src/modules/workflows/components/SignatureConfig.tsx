import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import type { StepSignature } from '../interfaces/Step';
import type { Position } from '../../../shared/interfaces/Catalog';
import { toast } from 'sonner';
import { Icon } from '../../../shared/components/Icon';

interface SignatureConfigProps {
    firmas: StepSignature[];
    onChange: (firmas: StepSignature[]) => void;
    positions: Position[];
    onOpenPdfPicker?: (initialCoords?: { coordX: number; coordY: number; pagina: number }) => void;
}

export const SignatureConfig = ({ firmas, onChange, positions, onOpenPdfPicker }: SignatureConfigProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const { register, handleSubmit, reset, setValue, control, watch } = useForm<StepSignature>();

    const onSubmit = (data: StepSignature) => {
        const selectedCargosIds = data.cargosIds ? data.cargosIds.map(Number).filter(n => !isNaN(n)) : undefined;
        const newFirma = {
            ...data,
            coordX: Number(data.coordX) || 0,
            coordY: Number(data.coordY) || 0,
            pagina: Number(data.pagina),
            cargoId: selectedCargosIds && selectedCargosIds.length > 0 ? undefined : (data.cargoId ? Number(data.cargoId) : undefined),
            cargosIds: selectedCargosIds && selectedCargosIds.length > 0 ? selectedCargosIds : undefined,
            usuarioId: undefined
        };

        if (editingIndex !== null) {
            const newFirmas = [...firmas];
            newFirmas[editingIndex] = newFirma;
            onChange(newFirmas);
            // Don't reset - just hide the form and keep values for next edit
            setEditingIndex(null);
            setIsAdding(false);
            toast.success('Zona actualizada');
        } else {
            onChange([...firmas, newFirma]);
            setIsAdding(false);
            reset();
            toast.success('Zona agregada');
        }
    };

    const handleEdit = (index: number) => {
        const firma = firmas[index];
        setEditingIndex(index);

        setValue('etiqueta', firma.etiqueta || '');
        setValue('pagina', firma.pagina);
        setValue('coordX', firma.coordX);
        setValue('coordY', firma.coordY);
        setValue('cargoId', firma.cargoId);
        setValue('cargosIds', firma.cargosIds || []);

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

    const getCargoDisplay = (firma: StepSignature) => {
        if (firma.cargoId) {
            return positions.find(p => p.id === firma.cargoId)?.nombre || 'Cargo específico';
        }
        if (firma.cargosIds && firma.cargosIds.length > 0) {
            const names = firma.cargosIds.map(id => positions.find(p => p.id === id)?.nombre).filter(Boolean);
            return names.join(', ');
        }
        return 'Cualquiera';
    };


    return (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">Zonas de Firma</h4>
                {!isAdding && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditingIndex(null); reset(); setIsAdding(true); }}>
                        <Icon name="add" className="mr-1 text-[18px]" />
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
                                {getCargoDisplay(firma)}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => handleEdit(idx)}
                                className="text-gray-400 hover:text-brand-blue"
                                title="Editar configuración"
                            >
                                <Icon name="edit" className="text-[20px]" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="text-gray-400 hover:text-red-600"
                                title="Eliminar"
                            >
                                <Icon name="delete" className="text-[20px]" />
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

                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                label="Página"
                                type="number"
                                {...register('pagina', { required: true, min: 1 })}
                                placeholder="1"
                            />
                            <Input
                                label="Coord X"
                                type="number"
                                {...register('coordX', { required: true })}
                                placeholder="X"
                            />
                            <Input
                                label="Coord Y"
                                type="number"
                                {...register('coordY', { required: true })}
                                placeholder="Y"
                            />
                        </div>
                        {onOpenPdfPicker && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const data = { coordX: Number(watch('coordX')) || 0, coordY: Number(watch('coordY')) || 0, pagina: Number(watch('pagina')) || 1 };
                                    onOpenPdfPicker(data);
                                }}
                            >
                                <Icon name="edit" className="mr-1 text-[16px]" />
                                Seleccionar en PDF
                            </Button>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargos Permitidos (Opcional)</label>
                        <p className="text-xs text-gray-500 mb-2">Seleccione uno o más cargos. Si el usuario tiene alguno de estos cargos, podrá firmar en este espacio.</p>
                        <Controller
                            name="cargosIds"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => (
                                <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                                    {positions.map(p => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={field.value?.includes(Number(p.id))}
                                                onChange={(e) => {
                                                    const selected = field.value || [];
                                                    if (e.target.checked) {
                                                        field.onChange([...selected, Number(p.id)]);
                                                    } else {
                                                        field.onChange(selected.filter((id: number) => id !== Number(p.id)));
                                                    }
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            {p.nombre}
                                        </label>
                                    ))}
                                </div>
                            )}
                        />
                        <p className="text-xs text-gray-400 mt-1">Deja vacío para que cualquier usuario pueda firmar.</p>
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
