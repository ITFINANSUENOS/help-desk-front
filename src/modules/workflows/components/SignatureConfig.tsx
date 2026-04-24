import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import type { StepSignature } from '../interfaces/Step';
import type { Position } from '../../../shared/interfaces/Catalog';
import { toast } from 'sonner';
import { Icon } from '../../../shared/components/Icon';
import { Tooltip } from '../../../shared/components/Tooltip';

interface SignatureConfigProps {
    firmas: StepSignature[];
    onChange: (firmas: StepSignature[]) => void;
    positions: Position[];
    onOpenPdfPicker?: (initialCoords?: { coordX: number; coordY: number; pagina: number }, editingIndex?: number) => void;
}

export const SignatureConfig = ({ firmas, onChange, positions, onOpenPdfPicker }: SignatureConfigProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const { register, handleSubmit, reset, setValue, control, watch } = useForm<StepSignature>();

    // Sync form when firmas prop changes (e.g., after PDF picker updates coordinates)
    useEffect(() => {
        if (editingIndex !== null && firmas[editingIndex]) {
            const firma = firmas[editingIndex];
            setValue('coordX', firma.coordX || 0, { shouldValidate: false });
            setValue('coordY', firma.coordY || 0, { shouldValidate: false });
            setValue('pagina', firma.pagina || 1, { shouldValidate: false });
            setValue('cargosIds', firma.cargosIds || [], { shouldValidate: false });
        }
    }, [firmas, editingIndex, setValue]);

    const onSubmit = (data: StepSignature) => {
        console.log('[SignatureConfig] onSubmit called', { data, firmas, editingIndex, isAdding });
        const selectedCargosIds = data.cargosIds ? data.cargosIds.map(Number).filter(n => !isNaN(n)) : undefined;
        const existingFirma = editingIndex !== null ? firmas[editingIndex] : null;
        console.log('[SignatureConfig] existingFirma:', existingFirma);
        const newFirma: StepSignature = {
            ...data,
            id: existingFirma?.id,
            coordX: Number(data.coordX) || 0,
            coordY: Number(data.coordY) || 0,
            pagina: Number(data.pagina),
            cargoId: selectedCargosIds && selectedCargosIds.length > 0 ? undefined : (data.cargoId ? Number(data.cargoId) : undefined),
            cargosIds: selectedCargosIds && selectedCargosIds.length > 0 ? selectedCargosIds : undefined,
            usuarioId: undefined
        };

        if (editingIndex !== null) {
            console.log('[SignatureConfig] Updating existing signature at index', editingIndex);
            const newFirmas = [...firmas];
            newFirmas[editingIndex] = newFirma;
            console.log('[SignatureConfig] Calling onChange with updated firmas:', newFirmas);
            onChange(newFirmas);
            setEditingIndex(null);
            setIsAdding(false);
            toast.success('Zona actualizada');
        } else {
            console.log('[SignatureConfig] Adding new signature, current firmas:', firmas);
            const updatedFirmas = [...firmas, newFirma];
            console.log('[SignatureConfig] Calling onChange with:', updatedFirmas);
            onChange(updatedFirmas);
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold uppercase text-gray-700">
                            {editingIndex !== null ? 'Editar Zona' : 'Nueva Zona'}
                        </h5>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Icon name="close" className="text-[18px]" />
                        </button>
                    </div>

                    {/* Zone Info Section */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="edit_document" className="text-blue-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Información de Zona</span>
                        </div>
                        <Input
                            label="Etiqueta PDF (Smart Tag)"
                            description="Etiqueta para ubicar la zona de firma automáticamente"
                            {...register('etiqueta')}
                            placeholder="Ej. FIRMA_GERENTE"
                        />
                    </div>

                    {/* Positioning Section */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-orange-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="pin_drop" className="text-orange-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Posición en PDF</span>
                            <Tooltip content="Coordenadas de la zona de firma" position="top" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                label="Página"
                                type="number"
                                description="Página"
                                {...register('pagina', { required: true, min: 1 })}
                                placeholder="1"
                            />
                            <Input
                                label="Coord X"
                                type="number"
                                description="Horizontal"
                                {...register('coordX', { required: true })}
                                placeholder="X"
                            />
                            <Input
                                label="Coord Y"
                                type="number"
                                description="Vertical"
                                {...register('coordY', { required: true })}
                                placeholder="Y"
                            />
                        </div>
                        {onOpenPdfPicker && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => {
                                    const data = { coordX: Number(watch('coordX')) || 0, coordY: Number(watch('coordY')) || 0, pagina: Number(watch('pagina')) || 1 };
                                    onOpenPdfPicker(data, editingIndex ?? undefined);
                                }}
                            >
                                <Icon name="edit" className="mr-1 text-[16px]" />
                                Seleccionar en PDF
                            </Button>
                        )}
                    </div>

                    {/* Cargos Section */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-green-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="badge" className="text-green-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Cargos que Pueden Firmar</span>
                            <Tooltip content="Seleccione los cargos habilitados para firmar. Use -1 para jefe inmediato." position="top" />
                        </div>

                        {/* Jefe Inmediato option */}
                        <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                            <Controller
                                name="cargosIds"
                                control={control}
                                defaultValue={[]}
                                render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.value?.includes(-1) || false}
                                            onChange={(e) => {
                                                const selected = field.value || [];
                                                if (e.target.checked) {
                                                    field.onChange([...selected, -1]);
                                                } else {
                                                    field.onChange(selected.filter((id: number) => id !== -1));
                                                }
                                            }}
                                            className="rounded text-brand-teal focus:ring-brand-teal"
                                        />
                                        <span className="text-xs font-medium text-amber-800">Jefe Inmediato (-1)</span>
                                        <Tooltip content="El jefe inmediato del usuario asignado puede firmar" position="right" />
                                    </label>
                                )}
                            />
                        </div>

                        <Controller
                            name="cargosIds"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 max-h-40 overflow-y-auto">
                                    {positions.map(p => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
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
                                                className="rounded text-brand-teal focus:ring-brand-teal"
                                            />
                                            <span className="text-gray-700 text-xs">{p.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        />
                        <p className="text-xs text-gray-400 mt-2">Dejar vacío para que cualquier usuario pueda firmar</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
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
