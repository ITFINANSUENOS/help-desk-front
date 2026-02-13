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

interface TemplateFieldsConfigProps {
    campos: StepTemplateField[];
    onChange: (campos: StepTemplateField[]) => void;
    flujoId: number;
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
                setExcelFiles(data);
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
                setColumns(data);
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
        <div className="space-y-2 p-3 bg-gray-50 rounded border border-gray-200">
            <label className="text-xs font-semibold text-gray-700 block">Configuración Excel</label>
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
            {isExcel && <p className="text-xs text-gray-400 font-mono mt-1">{campoQuery}</p>}
        </div>
    );
};

export const TemplateFieldsConfig = ({ campos, onChange, flujoId }: TemplateFieldsConfigProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const { register, handleSubmit, reset, setValue, control } = useForm<StepTemplateField>();

    // Filter only active campos (estado = 1)
    const activeCampos = campos.filter(campo => campo.estado === 1 || campo.estado === undefined);

    const handleAdd = (data: StepTemplateField) => {
        const newCampo: StepTemplateField = {
            ...data,
            coordX: Number(data.coordX) || 0,
            coordY: Number(data.coordY) || 0,
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
        const campo = activeCampos[index];
        reset(campo);
        const actualIndex = campos.findIndex(c => c === campo);
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
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700">Campos de Plantilla</h4>
                {!isAdding && (
                    <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                        <span className="material-symbols-outlined mr-1 text-[18px]">add</span>
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
                                    Código: {campo.codigo} | Tipo: {campo.tipo} | Pág: {campo.pagina}
                                    {campo.etiqueta ? <span className="ml-2 text-blue-600 bg-blue-50 px-1 rounded">🏷️ {campo.etiqueta}</span> : ` | X: ${campo.coordX}, Y: ${campo.coordY}`}
                                </p>
                                {campo.campoQuery && (
                                    <p className="text-xs text-gray-400 mt-1 font-mono">{campo.campoQuery}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(index)}
                                    className="text-gray-400 hover:text-brand-blue"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(index)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar/editar */}
            {isAdding && (
                <div className="bg-white p-4 rounded border border-gray-300 space-y-3">
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
                            {...register('pagina', { required: true })}
                            placeholder="1"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Etiqueta PDF (Smart Tag)</label>
                        <input
                            {...register('etiqueta')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ej. CAMPO_FECHA_1"
                        />
                        <p className="text-xs text-gray-500">Etiqueta en el PDF para ubicar el campo automáticamente</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Font Size"
                            type="number"
                            {...register('fontSize')}
                            placeholder="10"
                        />
                    </div>

                    {/* Source Config */}
                    <div className="space-y-2 border-t pt-2 mt-2">
                        <label className="text-sm font-semibold text-gray-700">Fuente de Datos</label>
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

                        {/* Render specific config based on source */}
                        {sourceType === 'CUSTOM' && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Query SQL / Valor</label>
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

                    <div className="flex gap-4 pt-2">
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
                        <Button type="button" size="sm" variant="brand" onClick={handleSubmit(handleAdd)}>
                            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

