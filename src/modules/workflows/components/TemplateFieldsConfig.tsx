import { useState, useEffect } from 'react';
import { useForm, useWatch, Controller, type Control, type UseFormSetValue } from 'react-hook-form';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import type { StepTemplateField } from '../interfaces/TemplateField';
import { FIELD_TYPES } from '../interfaces/TemplateField';
import { excelDataService } from '../../imports/services/excel-data.service';
import type { ExcelData } from '../../imports/interfaces/ExcelData';
import { toast } from 'sonner';
import { Icon } from '../../../shared/components/Icon';
import { Tooltip } from '../../../shared/components/Tooltip';

interface TemplateFieldsConfigProps {
    campos: StepTemplateField[];
    onChange: (campos: StepTemplateField[]) => void;
    flujoId: number;
    onOpenPdfPicker?: (initialCoords?: { coordX: number; coordY: number; pagina: number }, editingIndex?: number) => void;
}

const ExcelQueryConfig = ({ control, flujoId, setValue }: { control: Control<StepTemplateField>, flujoId: number, setValue: UseFormSetValue<StepTemplateField> }) => {
    const [excelFiles, setExcelFiles] = useState<ExcelData[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingCols, setLoadingCols] = useState(false);

    const campoQuery = useWatch({ control, name: 'campoQuery' }) || '';

    // Parse current query
    const isExcel = campoQuery.startsWith('EXCEL:');
    const parts = isExcel ? campoQuery.split(':') : [];
    const currentFileId = parts[1] ? Number(parts[1]) : '';
    const currentCol = parts[2] || '';

    useEffect(() => {
        const fetchFiles = async () => {
            if (!flujoId) return;
            setLoadingFiles(true);
            try {
                const data = await excelDataService.getByFlow(flujoId);
                setExcelFiles(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                toast.error('Error cargando archivos Excel');
            } finally {
                setLoadingFiles(false);
            }
        };
        fetchFiles();
    }, [flujoId]);

    useEffect(() => {
        const fetchColumns = async () => {
            if (!currentFileId) {
                setColumns([]);
                return;
            }
            setLoadingCols(true);
            try {
                const data = await excelDataService.getColumns(Number(currentFileId));
                setColumns(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCols(false);
            }
        };
        fetchColumns();
    }, [currentFileId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fileId = e.target.value;
        if (fileId) {
            // Reset col, set file
            setValue('campoQuery', `EXCEL:${fileId}:`);
        } else {
            setValue('campoQuery', '');
        }
    };

    const handleColChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const col = e.target.value;
        if (currentFileId) {
            setValue('campoQuery', `EXCEL:${currentFileId}:${col}`);
        }
    };

    return (
        <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-3">
            <div className="flex items-center gap-2">
                <Icon name="table_chart" className="text-gray-600" style={{ fontSize: '16px' }} />
                <span className="text-xs font-semibold text-gray-700">Configuración Excel</span>
            </div>
            <div className="flex items-center gap-2">
                <Select
                    value={currentFileId}
                    onChange={(val) => {
                        const e = { target: { value: val ? String(val) : '' } } as React.ChangeEvent<HTMLSelectElement>;
                        handleFileChange(e);
                    }}
                    disabled={loadingFiles}
                    placeholder="-- Seleccionar Archivo --"
                    options={excelFiles.map(f => ({ value: f.id, label: f.nombreArchivo }))}
                />
                <Tooltip content="Archivo Excel con los datos de origen" position="right" />
            </div>

            <div className="flex items-center gap-2">
                <Select
                    value={currentCol}
                    onChange={(val) => {
                        const e = { target: { value: val ? String(val) : '' } } as React.ChangeEvent<HTMLSelectElement>;
                        handleColChange(e);
                    }}
                    disabled={!currentFileId || loadingCols}
                    placeholder="-- Seleccionar Columna --"
                    options={columns.map(c => ({ value: c, label: c }))}
                />
                <Tooltip content="Columna del Excel que contiene el valor" position="right" />
            </div>
            {isExcel && <p className="text-xs text-gray-400 font-mono mt-1">{campoQuery}</p>}
        </div>
    );
};

export const TemplateFieldsConfig = ({ campos, onChange, flujoId, onOpenPdfPicker }: TemplateFieldsConfigProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const { register, handleSubmit, reset, setValue, control, watch } = useForm<StepTemplateField>();

    // Filter only active campos (estado = 1)
    const activeCampos = campos.filter(campo => campo.estado === 1 || campo.estado === undefined);

    // Sync form when campos prop changes (e.g., after PDF picker updates coordinates)
    useEffect(() => {
        if (editingIndex !== null && campos[editingIndex]) {
            const campo = campos[editingIndex];
            setValue('coordX', campo.coordX || 0, { shouldValidate: false });
            setValue('coordY', campo.coordY || 0, { shouldValidate: false });
            setValue('pagina', campo.pagina || 1, { shouldValidate: false });
        }
    }, [campos, editingIndex, setValue]);

    const handleAdd = (data: StepTemplateField) => {
        const originalId = editingIndex !== null ? campos[editingIndex]?.id : undefined;
        const newCampo: StepTemplateField = {
            ...data,
            id: originalId,
            coordX: Number(data.coordX) || 0,
            coordY: Number(data.coordY) || 0,
            pagina: Number(data.pagina),
            fontSize: Number(data.fontSize) || 10,
            campoTrigger: data.campoTrigger ? 1 : 0,
            mostrarDiasTranscurridos: !!data.mostrarDiasTranscurridos,
            estado: 1,
        };

        if (editingIndex !== null) {
            const updated = [...campos];
            updated[editingIndex] = newCampo;
            onChange(updated);
            setEditingIndex(null);
            setIsAdding(false);
            toast.success('Campo actualizado');
        } else {
            onChange([...campos, newCampo]);
            setIsAdding(false);
            reset();
            toast.success('Campo agregado');
        }
    };

    const handleEdit = (index: number) => {
        const campo = activeCampos[index];
        const actualIndex = campos.findIndex(c => c === campo);

        reset({
            nombre: campo.nombre || '',
            codigo: campo.codigo || '',
            tipo: campo.tipo || 'text',
            pagina: campo.pagina || 1,
            etiqueta: campo.etiqueta || '',
            fontSize: campo.fontSize || 10,
            coordX: campo.coordX || 0,
            coordY: campo.coordY || 0,
            campoQuery: campo.campoQuery || '',
            campoTrigger: campo.campoTrigger || 0,
            mostrarDiasTranscurridos: campo.mostrarDiasTranscurridos || false,
        });

        // Explicitly set values after reset for inputs that might not update correctly
        setValue('coordX', campo.coordX || 0, { shouldValidate: false });
        setValue('coordY', campo.coordY || 0, { shouldValidate: false });
        setValue('pagina', campo.pagina || 1, { shouldValidate: false });
        setValue('fontSize', campo.fontSize || 10, { shouldValidate: false });

        // Pass the actual index in the full campos array, not activeCampos index
        setEditingIndex(actualIndex);
        setIsAdding(true);
    };

    const handleDelete = (index: number) => {
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

    const watchedCampoQuery = useWatch({ control, name: 'campoQuery' }) || '';
    const sourceType = watchedCampoQuery.startsWith('EXCEL:') ? 'EXCEL' :
        (watchedCampoQuery === 'PRESET_FECHA_ACTUAL' ? 'PRESET_FECHA_ACTUAL' :
            (watchedCampoQuery.length > 0 ? 'CUSTOM' : ''));

    const handleSourceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'CUSTOM') {
            setValue('campoQuery', ''); // Clear to let user type
        } else if (val === 'EXCEL') {
            setValue('campoQuery', 'EXCEL:'); // Init excel mode
        } else if (val === 'PRESET_FECHA_ACTUAL') {
            setValue('campoQuery', 'PRESET_FECHA_ACTUAL');
        } else {
            setValue('campoQuery', '');
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-gray-700 mb-4">Campos de Plantilla</h4>

            {/* Lista de campos existentes */}
            {activeCampos.length > 0 && (
                <div className="space-y-2 mb-4">
                    {activeCampos.map((campo, index) => {
                        const sourceLabel = campo.campoQuery?.startsWith('EXCEL:')
                            ? 'Excel'
                            : campo.campoQuery === 'PRESET_FECHA_ACTUAL'
                                ? 'Fecha Actual'
                                : campo.campoQuery
                                    ? 'Custom SQL'
                                    : 'Ninguna';
                        return (
                            <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{campo.nombre}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${campo.tipo === 'text' ? 'bg-gray-100 text-gray-600' : campo.tipo === 'number' ? 'bg-blue-100 text-blue-700' : campo.tipo === 'date' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {campo.tipo}
                                            </span>
                                            {campo.campoTrigger === 1 && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Trigger</span>
                                            )}
                                            {campo.mostrarDiasTranscurridos ? (
                                                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">Días</span>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono">Código: {campo.codigo}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>Pág: {campo.pagina}</span>
                                            <span>X: {campo.coordX}</span>
                                            <span>Y: {campo.coordY}</span>
                                            <span>Font: {campo.fontSize}px</span>
                                        </div>
                                        {campo.etiqueta && (
                                            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">
                                                🏷️ {campo.etiqueta}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${sourceLabel !== 'Ninguna' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                📊 {sourceLabel}
                                            </span>
                                            {sourceLabel === 'Ninguna' ? null : (
                                                <span className="text-xs text-gray-400 font-mono">{campo.campoQuery}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(index)}
                                            className="text-gray-400 hover:text-brand-blue"
                                        >
                                            <Icon name="edit" className="text-[20px]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(index)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <Icon name="delete" className="text-[20px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Formulario para agregar/editar */}
            {isAdding && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold uppercase text-gray-700">
                            {editingIndex !== null ? 'Editar Campo' : 'Nuevo Campo'}
                        </h5>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Icon name="close" className="text-[18px]" />
                        </button>
                    </div>

                    {/* Basic Info Section */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="label" className="text-blue-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Información del Campo</span>
                        </div>
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

                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-[#121617]">Tipo</label>
                                    <Tooltip content="Tipo de dato del campo (text, number, date, etc.)" position="right" />
                                </div>
                                <Controller
                                    name="tipo"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            options={FIELD_TYPES.map(type => ({ value: type.value, label: type.label }))}
                                            onChange={(val) => field.onChange(val)}
                                            placeholder="Seleccionar..."
                                        />
                                    )}
                                />
                            </div>
                            <Input
                                label="Página"
                                type="number"
                                description="Página del PDF"
                                {...register('pagina', { required: true })}
                                placeholder="1"
                            />
                        </div>

                        <div className="space-y-1 mt-3">
                            <label className="text-xs font-semibold text-[#121617]">Etiqueta PDF (Smart Tag)</label>
                            <input
                                {...register('etiqueta')}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ej. CAMPO_FECHA_1"
                            />
                            <p className="text-xs text-gray-500">Etiqueta para ubicar el campo automáticamente</p>
                        </div>
                    </div>

                    {/* Positioning Section */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-orange-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="pin_drop" className="text-orange-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Posición en PDF</span>
                            <Tooltip content="Coordenadas y tamaño del campo" position="top" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
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
                            <Input
                                label="Font Size"
                                type="number"
                                description="Tamaño"
                                {...register('fontSize')}
                                placeholder="10"
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
                                    onOpenPdfPicker(data, editingIndex!);
                                }}
                            >
                                <Icon name="edit" className="mr-1 text-[16px]" />
                                Seleccionar en PDF
                            </Button>
                        )}
                    </div>

                    {/* Source Config */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-green-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="storage" className="text-green-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Fuente de Datos</span>
                            <Tooltip content="Define de dónde obtiene su valor este campo" position="top" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-[#121617] whitespace-nowrap">Tipo:</label>
                                <Select
                                    value={sourceType}
                                    onChange={(val) => {
                                        const e = { target: { value: val ? String(val) : '' } } as React.ChangeEvent<HTMLSelectElement>;
                                        handleSourceTypeChange(e);
                                    }}
                                    options={[
                                        { value: '', label: 'Ninguna' },
                                        { value: 'CUSTOM', label: 'Consulta Manual / SQL' },
                                        { value: 'EXCEL', label: 'Datos Excel' },
                                        { value: 'PRESET_FECHA_ACTUAL', label: 'Fecha Actual' }
                                    ]}
                                />
                                <Tooltip content="Selecciona el origen de los datos" position="right" />
                            </div>

                            {sourceType === 'CUSTOM' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#121617]">Query SQL / Valor</label>
                                    <textarea
                                        {...register('campoQuery')}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                                        rows={2}
                                        placeholder="SELECT ip FROM..."
                                    />
                                </div>
                            )}

                            {sourceType === 'EXCEL' && (
                                <ExcelQueryConfig
                                    control={control}
                                    flujoId={flujoId}
                                    setValue={setValue}
                                />
                            )}
                        </div>
                    </div>

                    {/* Flags Section */}
                    <div className="p-3 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="widgets" className="text-purple-600" style={{ fontSize: '16px' }} />
                            <span className="text-xs font-semibold text-gray-900">Opciones de Campo</span>
                            <Tooltip content="Comportamiento especial del campo" position="top" />
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('campoTrigger')}
                                    className="rounded text-brand-teal focus:ring-brand-teal"
                                />
                                <span className="text-xs text-gray-700">Campo Trigger</span>
                                <Tooltip content="Campo que inicia el conteo de días transcurridos" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('mostrarDiasTranscurridos')}
                                    className="rounded text-brand-teal focus:ring-brand-teal"
                                />
                                <span className="text-xs text-gray-700">Mostrar Días</span>
                                <Tooltip content="Muestra el tiempo transcurrido" position="right" />
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>Cancelar</Button>
                        <Button type="button" size="sm" variant="brand" onClick={handleSubmit(handleAdd)}>
                            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

