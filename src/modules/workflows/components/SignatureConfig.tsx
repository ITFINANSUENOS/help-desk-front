import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { IconTrash, IconPlus, IconCrosshair, IconEdit } from '@tabler/icons-react';
import type { StepSignature } from '../interfaces/Step';
import type { Position } from '../../../shared/interfaces/Catalog';
import { PdfCoordinateSelector } from './PdfCoordinateSelector';
import { toast } from 'sonner';

interface SignatureConfigProps {
    firmas: StepSignature[];
    onChange: (firmas: StepSignature[]) => void;
    positions: Position[];
    pdfUrl?: string | null;
}

export const SignatureConfig = ({ firmas, onChange, positions, pdfUrl }: SignatureConfigProps) => {
    // Local state for the form being added
    const [isAdding, setIsAdding] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    // targetIndex: number (direct update list), 'form' (update form inputs)
    const [targetIndex, setTargetIndex] = useState<number | 'form' | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<StepSignature>();

    const onSubmit = (data: StepSignature) => {
        const newFirma = {
            ...data,
            coordX: Number(data.coordX),
            coordY: Number(data.coordY),
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

    const openSelector = (target: number | 'form') => {
        if (!pdfUrl) {
            toast.error('Debe cargar un PDF base primero para usar el selector visual.');
            return;
        }
        setTargetIndex(target);
        setSelectorOpen(true);
    };

    const handleCoordinatesSelected = (page: number, x: number, y: number) => {
        setSelectorOpen(false);
        if (targetIndex === 'form') {
            setValue('pagina', page);
            setValue('coordX', x);
            setValue('coordY', y);
            toast.success('Coordenadas capturadas en formulario');
        } else if (typeof targetIndex === 'number') {
            // Updating existing signature directly from list button
            const newFirmas = [...firmas];
            newFirmas[targetIndex] = {
                ...newFirmas[targetIndex],
                pagina: page,
                coordX: x,
                coordY: y
            };
            onChange(newFirmas);
            toast.success('Coordenadas actualizadas');
        }
    };



    return (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">Zonas de Firma</h4>
                {!isAdding && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditingIndex(null); reset(); setIsAdding(true); }}>
                        <IconPlus size={16} className="mr-1" />
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
                                className="text-gray-500 hover:bg-gray-100 p-1 rounded"
                                title="Editar configuración"
                            >
                                <IconEdit size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => openSelector(idx)}
                                className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                title="Actualizar posición visualmente"
                            >
                                <IconCrosshair size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                title="Eliminar"
                            >
                                <IconTrash size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="bg-white p-3 rounded border border-blue-200 space-y-3 shadow-md">
                    <h5 className="text-xs font-bold uppercase text-blue-600 flex justify-between items-center">
                        {editingIndex !== null ? 'Editar Zona' : 'Nueva Zona'}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openSelector('form')}
                        >
                            <IconCrosshair size={14} className="mr-1" />
                            Seleccionar Visualmente
                        </Button>
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Etiqueta PDF (Smart Tag)"
                            {...register('etiqueta')}
                            placeholder="Ej. FIRMA_GERENTE"
                        />
                        <div className="grid grid-cols-3 gap-3">
                            <Input
                                label="Página"
                                type="number"
                                {...register('pagina', { required: true, min: 1 })}
                                placeholder="1"
                            />
                            <Input
                                label="Coord X"
                                type="number"
                                step="0.1"
                                {...register('coordX', { required: true })}
                            />
                            <Input
                                label="Coord Y"
                                type="number"
                                step="0.1"
                                {...register('coordY', { required: true })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargo (Opcional)</label>
                        <select
                            {...register('cargoId')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">-- Cualquiera --</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>Cancelar</Button>
                        <Button type="button" size="sm" variant="brand" onClick={handleSubmit(onSubmit)}>
                            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </div>
                </div>
            )}

            {selectorOpen && pdfUrl && (
                <PdfCoordinateSelector
                    file={pdfUrl}
                    onClose={() => setSelectorOpen(false)}
                    onSelect={handleCoordinatesSelected}
                />
            )}
        </div>
    );
};
