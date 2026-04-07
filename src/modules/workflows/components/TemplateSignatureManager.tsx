import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import type { TemplateSignature } from '../interfaces/TemplateField';
import { templateService } from '../../templates/services/template.service';
import { positionService } from '../../../shared/services/catalog.service';
import type { Position } from '../../../shared/interfaces/Catalog';
import { toast } from 'sonner';
import { Icon } from '../../../shared/components/Icon';
import { PdfCoordinateSelector, type CoordinateData, type ExistingZone } from './PdfCoordinateSelector';

interface TemplateSignatureManagerProps {
    flujoPlantillaId: number;
    onZonasChange?: () => void;
    /** URL base for PDF document */
    pdfUrl?: string;
}

interface FormData {
    coordX: number;
    coordY: number;
    pagina: number;
    etiqueta: string;
    cargosIds: number[];
}

export const TemplateSignatureManager = ({ flujoPlantillaId, onZonasChange, pdfUrl }: TemplateSignatureManagerProps) => {
    const [firmas, setFirmas] = useState<TemplateSignature[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [showCoordinateSelector, setShowCoordinateSelector] = useState(false);

    const { register, handleSubmit, reset, setValue, control } = useForm<FormData>();

    const loadFirmas = async () => {
        setIsLoading(true);
        try {
            const data = await templateService.getTemplateSignatures(flujoPlantillaId);
            setFirmas(data || []);
        } catch (error) {
            console.error('Error loading firmas:', error);
            toast.error('Error al cargar zonas de firma');
        } finally {
            setIsLoading(false);
        }
    };

    const loadPositions = async () => {
        try {
            const data = await positionService.getAllActive();
            setPositions(data || []);
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    };

    useEffect(() => {
        loadFirmas();
        loadPositions();
    }, [flujoPlantillaId]);

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            if (editingId !== null) {
                await templateService.updateTemplateSignature(editingId, {
                    coordX: data.coordX,
                    coordY: data.coordY,
                    pagina: data.pagina,
                    etiqueta: data.etiqueta || undefined,
                });
                toast.success('Zona actualizada');
            } else {
                await templateService.createTemplateSignature(flujoPlantillaId, {
                    coordX: data.coordX,
                    coordY: data.coordY,
                    pagina: data.pagina,
                    etiqueta: data.etiqueta || undefined,
                });
                toast.success('Zona creada');
            }
            reset();
            setIsAdding(false);
            setEditingId(null);
            loadFirmas();
            onZonasChange?.();
        } catch (error) {
            console.error('Error saving firma:', error);
            toast.error('Error al guardar zona de firma');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (firma: TemplateSignature) => {
        setEditingId(firma.id!);
        setValue('coordX', firma.coordX);
        setValue('coordY', firma.coordY);
        setValue('pagina', firma.pagina);
        setValue('etiqueta', firma.etiqueta || '');
        setValue('cargosIds', []);
        setIsAdding(true);
    };

    const handleDelete = async (firmaId: number) => {
        if (!confirm('¿Eliminar esta zona de firma?')) return;
        try {
            await templateService.deleteTemplateSignature(firmaId);
            toast.success('Zona eliminada');
            loadFirmas();
            onZonasChange?.();
        } catch (error) {
            console.error('Error deleting firma:', error);
            toast.error('Error al eliminar zona');
        }
    };

    const handleCancel = () => {
        reset();
        setIsAdding(false);
        setEditingId(null);
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Icon name="edit-signature" className="text-blue-600" />
                            Zonas de Firma
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Define las áreas del PDF y los cargos que pueden firmar
                        </p>
                    </div>
                    {!isAdding && (
                        <Button
                            size="sm"
                            variant="brand"
                            onClick={() => { reset(); setEditingId(null); setIsAdding(true); }}
                        >
                            <Icon name="add" className="mr-1" />
                            Nueva Zona
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Cargando zonas de firma...
                </div>
            ) : (
                <div>
                    {/* Lista de zonas existentes */}
                    {firmas.length === 0 && !isAdding && (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon name="edit-signature" className="text-gray-400 text-2xl" />
                            </div>
                            <p className="text-gray-500 font-medium mb-1">No hay zonas de firma configuradas</p>
                            <p className="text-sm text-gray-400 mb-4">
                                Agrega zonas para definir dónde y quién puede firmar
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { reset(); setEditingId(null); setIsAdding(true); }}
                            >
                                <Icon name="add" className="mr-1" />
                                Crear primera zona
                            </Button>
                        </div>
                    )}

                    {/* Lista de zonas */}
                    {firmas.map((firma) => (
                        <div
                            key={firma.id}
                            className={`p-4 border-b border-gray-100 ${
                                editingId === firma.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-600 font-bold">#{firma.id}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {firma.etiqueta || 'Sin nombre'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Página {firma.pagina} • ({firma.coordX}, {firma.coordY})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(firma)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar zona"
                                    >
                                        <Icon name="edit" className="text-[18px]" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(firma.id!)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar zona"
                                    >
                                        <Icon name="delete" className="text-[18px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Formulario para agregar/editar */}
                    {isAdding && (
                        <div className="p-4 bg-gradient-to-b from-blue-50 to-white border-t-2 border-blue-400">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <Icon name={editingId !== null ? 'edit' : 'add'} className="text-white text-lg" />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                    {editingId !== null ? 'Editar Zona de Firma' : 'Nueva Zona de Firma'}
                                </h4>
                            </div>

                            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                                {/* Nombre de la zona */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Zona
                                    </label>
                                    <input
                                        type="text"
                                        {...register('etiqueta')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Ej: Firma Gerente, Firma Cliente"
                                    />
                                </div>

                                {/* Coordenadas */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Página</label>
                                        <input
                                            type="number"
                                            min={1}
                                            {...register('pagina', { required: true, valueAsNumber: true })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Posición X</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('coordX', { required: true, valueAsNumber: true })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Posición Y</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('coordY', { required: true, valueAsNumber: true })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Botón para seleccionar coordenadas visualmente */}
                                {pdfUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCoordinateSelector(true)}
                                        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg text-sm font-medium text-green-700 transition-colors"
                                    >
                                        <Icon name="view" className="text-lg" />
                                        Seleccionar posición en PDF
                                    </button>
                                )}

                                {/* Cargos que pueden firmar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cargos que pueden firmar esta zona
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Selecciona uno o más cargos. Si el usuario tiene alguno de estos cargos, podrá firmar.
                                    </p>
                                    <Controller
                                        name="cargosIds"
                                        control={control}
                                        defaultValue={[]}
                                        render={({ field }) => (
                                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white space-y-1">
                                                {/* Opción especial: Jefe Inmediato */}
                                                <label
                                                    className="flex items-center gap-2 text-sm py-1 px-2 hover:bg-purple-50 rounded cursor-pointer bg-purple-50 border border-purple-200"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={field.value?.includes(-1)}
                                                        onChange={(e) => {
                                                            const selected = field.value || [];
                                                            if (e.target.checked) {
                                                                field.onChange([-1, ...selected.filter(id => id !== -1)]);
                                                            } else {
                                                                field.onChange(selected.filter((id: number) => id !== -1));
                                                            }
                                                        }}
                                                        className="rounded border-purple-300"
                                                    />
                                                    <span className="font-semibold text-purple-700">JEFE INMEDIATO (-1)</span>
                                                    <span className="text-xs text-purple-500">(El jefe directo del usuario)</span>
                                                </label>

                                                <div className="border-t border-gray-200 my-2" />

                                                {/* Lista de cargos normales */}
                                                {positions.map((p) => (
                                                    <label
                                                        key={p.id}
                                                        className="flex items-center gap-2 text-sm py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
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
                                    <p className="text-xs text-gray-400 mt-1">
                                        Deja vacío para que cualquier usuario pueda firmar.
                                    </p>
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                                    <Button type="button" variant="ghost" onClick={handleCancel}>
                                        Cancelar
                                    </Button>
                                    <Button type="button" variant="brand" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
                                        {isSaving ? 'Guardando...' : (editingId !== null ? 'Actualizar' : 'Crear')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de selección visual de coordenadas */}
            {showCoordinateSelector && pdfUrl && (
                <PdfCoordinateSelector
                    isOpen={showCoordinateSelector}
                    onClose={() => setShowCoordinateSelector(false)}
                    pdfUrl={pdfUrl}
                    existingZones={firmas.map((f): ExistingZone => ({
                        id: f.id || 0,
                        coordX: f.coordX,
                        coordY: f.coordY,
                        pagina: f.pagina,
                        etiqueta: f.etiqueta,
                    }))}
                    onCoordinateSelect={(coords: CoordinateData) => {
                        setValue('coordX', coords.coordX);
                        setValue('coordY', coords.coordY);
                        setValue('pagina', coords.pagina);
                        setShowCoordinateSelector(false);
                    }}
                    zoneType="signature"
                />
            )}
        </div>
    );
};