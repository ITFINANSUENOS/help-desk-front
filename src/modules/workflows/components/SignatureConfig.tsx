import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { IconTrash, IconPlus, IconCrosshair } from '@tabler/icons-react';
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
    // targetIndex: number (editing existing index) or 'new' (adding new one)
    const [targetIndex, setTargetIndex] = useState<number | 'new' | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<StepSignature>();

    const handleAdd = (data: StepSignature) => {
        const newFirma = {
            ...data,
            coordX: Number(data.coordX),
            coordY: Number(data.coordY),
            pagina: Number(data.pagina),
            cargoId: data.cargoId ? Number(data.cargoId) : undefined,
            usuarioId: undefined
        };
        onChange([...firmas, newFirma]);
        reset();
        setIsAdding(false);
    };

    const handleRemove = (index: number) => {
        const newFirmas = [...firmas];
        newFirmas.splice(index, 1);
        onChange(newFirmas);
    };

    const openSelector = (index: number | 'new') => {
        if (!pdfUrl) {
            toast.error('Debe cargar un PDF base primero para usar el selector visual.');
            return;
        }
        setTargetIndex(index);
        setSelectorOpen(true);
    };

    const handleCoordinatesSelected = (page: number, x: number, y: number) => {
        setSelectorOpen(false);
        if (targetIndex === 'new') {
            setValue('pagina', page);
            setValue('coordX', x);
            setValue('coordY', y);
            toast.success('Coordenadas capturadas');
        } else if (typeof targetIndex === 'number') {
            // Updating existing signature?
            // Current implementation doesn't support editing existing rows inline fully, 
            // but we can update the 'firmas' array directly.
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
                    <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
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
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 text-sm">
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
                            <span className="truncate col-span-2">
                                {firma.cargoId
                                    ? positions.find(p => p.id === firma.cargoId)?.nombre
                                    : 'Cualquiera'}
                            </span>
                        </div>
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
                        >
                            <IconTrash size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="bg-white p-3 rounded border border-blue-200 space-y-3">
                    <h5 className="text-xs font-bold uppercase text-blue-600 flex justify-between items-center">
                        Nueva Zona
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openSelector('new')}
                        >
                            <IconCrosshair size={14} className="mr-1" />
                            Seleccionar Visualmente
                        </Button>
                    </h5>
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
                        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                        <Button size="sm" variant="brand" onClick={handleSubmit(handleAdd)}>Agregar</Button>
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
