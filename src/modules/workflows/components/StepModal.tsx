import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import type { Step, CreateStepDto, StepSignature } from '../interfaces/Step';
import type { StepTemplateField } from '../interfaces/TemplateField';
import { stepService } from '../services/step.service';
import { positionService } from '../../../shared/services/catalog.service';
import type { Position } from '../../../shared/interfaces/Catalog';
import { templateService } from '../../templates/services/template.service';
import type { TemplateField } from '../../templates/interfaces/TemplateField';
import { toast } from 'sonner';
import { SignatureConfig } from './SignatureConfig';
import { TemplateFieldsConfig as TemplateFieldsConfigComponent } from './TemplateFieldsConfig';
import { SpecificAssignmentConfig } from './SpecificAssignmentConfig';
import { Icon } from '../../../shared/components/Icon';

interface StepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    step: Step | null;
    flujoId: number;
}

export const StepModal = ({ isOpen, onClose, onSuccess, step, flujoId }: StepModalProps) => {
    const isEdit = !!step;
    const { register, handleSubmit, reset, control, setValue, watch, formState: { isSubmitting } } = useForm<CreateStepDto>();
    const [positions, setPositions] = useState<Position[]>([]);
    const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [archivosPaso, setArchivosPaso] = useState<{ id: number; nombre: string; nombreArchivo: string; tipo: string }[]>([]);
    const [archivoSubir, setArchivoSubir] = useState<File | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [tipoArchivo, setTipoArchivo] = useState<'descargable' | 'plantilla'>('descargable');
    const [localCampos, setLocalCampos] = useState<StepTemplateField[]>([]);
    const [requiresCamposPlantilla, setRequiresCamposPlantilla] = useState(false);



    // Track the last loaded step ID to prevent unwanted resets during re-renders
    const lastStepIdRef = useRef<number | null>(null);
    const stepId = step?.id ?? null;

    useEffect(() => {
        if (isOpen) {
            const currentId = stepId ?? -1;

            // Only load/reset data if we haven't loaded this step yet
            if (currentId !== lastStepIdRef.current) {

                lastStepIdRef.current = currentId;

                loadCatalogs();
                setPdfFile(null);
                setArchivosPaso([]);
                setArchivoSubir(null);
                setNombreArchivo('');
                setTipoArchivo('descargable');
                setLocalCampos([]);
                setRequiresCamposPlantilla(false);

                if (stepId !== null) {
                    // Fetch fresh data for step to get standard DTO structure
                    stepService.getStep(stepId).then(fullStep => {

                        // Cargar archivos del paso
                        stepService.getArchivosByPaso(stepId).then(archivos => {
                            setArchivosPaso(archivos.map((a: any) => ({
                                id: a.id,
                                nombre: a.nombre,
                                nombreArchivo: a.nombreArchivo,
                                tipo: a.tipo
                            })));
                        }).catch(console.error);

                        // Use setValue instead of reset to properly update form
                        setValue('flujoId', fullStep.flujoId);
                        setValue('orden', fullStep.orden);
                        setValue('nombre', fullStep.nombre);
                        setValue('descripcion', fullStep.descripcion || '');
                        setValue('cargoAsignadoId', fullStep.cargoAsignadoId);
                        setValue('tiempoHabil', fullStep.tiempoHabil);
                        setValue('campoReferenciaJefeId', fullStep.campoReferenciaJefeId);
                        setValue('esAprobacion', !!fullStep.esAprobacion);
                        setValue('esTareaNacional', !!fullStep.esTareaNacional);
                        setValue('requiereSeleccionManual', fullStep.requiereSeleccionManual);
                        setValue('nombreAdjunto', fullStep.nombreAdjunto || '');
                        setValue('permiteCerrar', fullStep.permiteCerrar);
                        setValue('necesitaAprobacionJefe', !!fullStep.necesitaAprobacionJefe);
                        setValue('esParalelo', !!fullStep.esParalelo);
                        setValue('esPool', !!fullStep.esPool);
                        setValue('requiereFirma', !!fullStep.requiereFirma);
                        setValue('requiereCamposPlantilla', fullStep.requiereCamposPlantilla);
                        setValue('asignarCreador', !!fullStep.asignarCreador);
                        setValue('cerrarTicketObligatorio', !!fullStep.cerrarTicketObligatorio);
                        setValue('permiteDespachoMasivo', !!fullStep.permiteDespachoMasivo);
                        setValue('firmas', fullStep.firmas || []);
                        setValue('campos', fullStep.campos || []);
                        setValue('usuariosEspecificos', fullStep.usuarios?.map(u => ({
                            usuarioId: u.usuarioId || undefined,
                            cargoId: u.cargoId || undefined
                        })) || []);

                        setLocalCampos(fullStep.campos || []);
                        setRequiresCamposPlantilla(!!fullStep.requiereCamposPlantilla);
                    }).catch(err => {
                        console.error('[StepModal] Error loading step details:', err);
                    });
                } else {

                    reset({
                        flujoId,
                        orden: 0,
                        nombre: '',
                        esAprobacion: false,
                        campos: [],
                        firmas: []
                    });
                }
            }
        } else {
            // Reset the ref when modal closes so it reloads next time
            lastStepIdRef.current = null;
        }
    }, [isOpen, stepId, flujoId, reset]);

    const loadCatalogs = () => {
        positionService.getAllActive().then(setPositions).catch(console.error);
        templateService.getAllFields().then(setTemplateFields).catch(console.error);
    };

    const handleCamposChange = useCallback((newCampos: StepTemplateField[]) => {
        setLocalCampos(newCampos as StepTemplateField[]);
    }, []);

    const isPool = watch('esPool');
    useEffect(() => {
        if (isPool) {
            setValue('cargoAsignadoId', undefined);
        }
    }, [isPool, setValue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: CreateStepDto) => {
        try {
            // Sync local campos to form data before submit
            data.campos = localCampos;

            data.orden = Number(data.orden);
            data.flujoId = Number(flujoId);

            if (data.esPool) {
                (data as any).cargoAsignadoId = null;
            } else if (data.cargoAsignadoId) {
                data.cargoAsignadoId = Number(data.cargoAsignadoId);
            } else {
                (data as any).cargoAsignadoId = null;
            }

            if (data.tiempoHabil) data.tiempoHabil = Number(data.tiempoHabil);

            data.requiereSeleccionManual = data.requiereSeleccionManual ? 1 : 0;
            data.permiteCerrar = data.permiteCerrar ? 1 : 0;
            data.requiereCamposPlantilla = data.requiereCamposPlantilla ? 1 : 0;



            let stepId = step?.id;

            if (isEdit && step) {
                await stepService.updateStep(step.id, data);
            } else {
                const newStep = await stepService.createStep(data);
                stepId = newStep.id;
            }

            // Handle PDF Upload if file selected
            if (pdfFile && stepId) {
                await stepService.uploadFile(stepId, pdfFile);
            }

            toast.success(isEdit ? 'Paso actualizado' : 'Paso creado');
            onSuccess();
        } catch (error) {
            console.error('[StepModal] Error saving step:', error);
            toast.error('Error al guardar el paso');
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar Paso' : 'Nuevo Paso'}
            onSubmit={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="lg"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <Input
                                label="Orden"
                                type="number"
                                {...register('orden', { required: 'Requerido' })}
                                defaultValue={watch('orden')}
                            />
                        </div>
                        <div className="col-span-3">
                            <Input
                                label="Nombre del Paso"
                                {...register('nombre', { required: 'Requerido' })}
                                placeholder="Ej. Aprobación Gerencia"
                                defaultValue={watch('nombre')}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#121617]">Descripción</label>
                        <Controller
                            control={control}
                            name="descripcion"
                            render={({ field }) => (
                                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <RichTextEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="Instrucciones para este paso..."
                                        height={150}
                                    />
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Assignment & SLA */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cargo Asignado (Default)</label>
                    <Controller
                        name="cargoAsignadoId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                disabled={!!watch('esPool')}
                                options={positions.map(p => ({ value: p.id, label: p.nombre }))}
                                onChange={(val) => field.onChange(val)}
                                placeholder="-- Seleccionar --"
                            />
                        )}
                    />
                    {!!watch('esPool') && (
                        <p className="text-xs text-brand-teal mt-1">Cargo deshabilitado por ser asignación en Pool. Escoge los usuarios abajo.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Input
                        label="Tiempo SLA (Días)"
                        type="number"
                        {...register('tiempoHabil')}
                        placeholder="Ej. 1"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Campo Ref. Jefe (Opcional)</label>
                    <Controller
                        name="campoReferenciaJefeId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={Array.isArray(templateFields) ? templateFields.map(f => ({ value: f.id, label: `${f.etiqueta} (${f.codigo})` })) : []}
                                onChange={(val) => field.onChange(val)}
                                placeholder="-- Seleccionar Campo --"
                            />
                        )}
                    />
                    <p className="text-xs text-gray-500">Usado para determinar jefe inmediato dinámicamente.</p>
                </div>

                {/* Flags Section */}
                <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuraciones Adicionales</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esAprobacion')} defaultChecked={watch('esAprobacion')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Es Aprobación</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esTareaNacional')} defaultChecked={watch('esTareaNacional')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Tarea Nacional</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            {/* Note: manually handled in onSubmit to number */}
                            <input type="checkbox" {...register('requiereSeleccionManual')} defaultChecked={!!watch('requiereSeleccionManual')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Selección Manual</span>
                        </label>

                        {/* Show Specific Assignment Config when manual selection is enabled OR when esPool is used */}
                        {(!!watch('requiereSeleccionManual') || !!watch('esPool')) && (
                            <div className="col-span-full mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    {watch('esPool') ? "Usuarios del Grupo (Pool)" : "Usuarios y Cargos Específicos"}
                                </h4>
                                <Controller
                                    control={control}
                                    name="usuariosEspecificos"
                                    render={({ field }) => (
                                        <SpecificAssignmentConfig
                                            assignments={field.value || []}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('necesitaAprobacionJefe')} defaultChecked={watch('necesitaAprobacionJefe')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Aprueba Jefe</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('requiereFirma')} defaultChecked={watch('requiereFirma')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Requiere Firma</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('permiteCerrar')} defaultChecked={!!watch('permiteCerrar')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Permite Cerrar</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('asignarCreador')} defaultChecked={watch('asignarCreador')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Asignar a Creador</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esParalelo')} defaultChecked={watch('esParalelo')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Es Paralelo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esPool')} defaultChecked={watch('esPool')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700 font-medium">Asignación Grupo (Pool)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('cerrarTicketObligatorio')} defaultChecked={watch('cerrarTicketObligatorio')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Cerrar Ticket Obligatorio</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('permiteDespachoMasivo')} defaultChecked={watch('permiteDespachoMasivo')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Permite Despacho Masivo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                {...register('requiereCamposPlantilla', {
                                    onChange: (e) => setRequiresCamposPlantilla(e.target.checked)
                                })} 
                                defaultChecked={requiresCamposPlantilla}
                                className="rounded text-brand-teal focus:ring-brand-teal" 
                            />
                            <span className="text-sm text-gray-700">Requiere Campos Plantilla</span>
                        </label>
                    </div>

                    {!!watch('requiereFirma') && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base PDF para Firmas
                                </label>
                                <div className="flex gap-2 items-center">
                                    <label className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                                        <Icon name="upload" className="text-[20px]" />
                                        <span>
                                            {pdfFile ? pdfFile.name : step?.nombreAdjunto ? 'Cambiar PDF' : 'Subir PDF'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {(pdfFile || step?.nombreAdjunto) && (
                                        <span className="text-sm text-green-600 font-medium">
                                            {pdfFile ? 'Archivo seleccionado' : `Actual: ${step?.nombreAdjunto}`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <SignatureConfig
                                firmas={(watch('firmas') || []) as unknown as StepSignature[]}
                                onChange={(newFirmas) => setValue('firmas', newFirmas)}
                                positions={positions}
                            />
                        </div>
                    )}

                    {!!requiresCamposPlantilla && (
                        <div className="mt-4">
                            <TemplateFieldsConfigComponent
                                campos={localCampos as unknown as StepTemplateField[]}
                                onChange={handleCamposChange}
                                flujoId={Number(flujoId)}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1 mt-4">
                        <Input
                            label="Nombre de Adjunto Requerido (Solo informativo)"
                            {...register('nombreAdjunto')}
                            placeholder="Si requiere archivo, nombre aquí..."
                        />
                    </div>

                    {/* Step Files Section - for tm_paso_archivo */}
                    {isEdit && (
                        <div className="col-span-1 md:col-span-2 mt-6 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Archivos del Paso</h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Estos archivos estarán disponibles para los usuarios cuando lleguen a este paso del flujo.
                            </p>

                            {/* Upload new file */}
                            <div className="flex flex-wrap gap-3 items-end mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-[200px]">
                                    <Input
                                        label="Nombre"
                                        value={nombreArchivo}
                                        onChange={(e) => setNombreArchivo(e.target.value)}
                                        placeholder="Ej. Formato F47"
                                    />
                                </div>
                                <div className="w-40">
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Tipo</label>
                                    <Select
                                        value={tipoArchivo}
                                        onChange={(val) => setTipoArchivo(val as 'descargable' | 'plantilla')}
                                        options={[
                                            { value: 'descargable', label: 'Descargable' },
                                            { value: 'plantilla', label: 'Plantilla' }
                                        ]}
                                    />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Archivo</label>
                                    <label className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm w-fit">
                                        <Icon name="upload" className="text-[16px]" />
                                        <span>{archivoSubir ? archivoSubir.name : 'Seleccionar archivo'}</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setArchivoSubir(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    disabled={!archivoSubir || !nombreArchivo}
                                    onClick={async () => {
                                        if (!archivoSubir || !nombreArchivo || !step) return;
                                        try {
                                            await stepService.uploadArchivo(step.id, archivoSubir, nombreArchivo, tipoArchivo);
                                            toast.success('Archivo subido correctamente');
                                            setArchivoSubir(null);
                                            setNombreArchivo('');
                                            const archivos = await stepService.getArchivosByPaso(step.id);
                                            setArchivosPaso(archivos.map((a: any) => ({
                                                id: a.id,
                                                nombre: a.nombre,
                                                nombreArchivo: a.nombreArchivo,
                                                tipo: a.tipo
                                            })));
                                        } catch (error) {
                                            console.error('Error uploading file:', error);
                                            toast.error('Error al subir archivo');
                                        }
                                    }}
                                    className="px-4 py-2 bg-brand-teal text-white rounded text-sm font-medium hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Subir
                                </button>
                            </div>

                            {/* List existing files */}
                            {archivosPaso.length > 0 ? (
                                <div className="space-y-2">
                                    {archivosPaso.map((archivo) => (
                                        <div key={archivo.id} className={`flex items-center justify-between p-3 rounded border ${
                                            archivo.tipo === 'plantilla' ? 'bg-teal-50 border-teal-200' : 'bg-blue-50 border-blue-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <Icon 
                                                    name={archivo.tipo === 'plantilla' ? 'description' : 'insert_drive_file'} 
                                                    className={`text-lg ${archivo.tipo === 'plantilla' ? 'text-teal-600' : 'text-blue-600'}`} 
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{archivo.nombre}</p>
                                                    <p className="text-xs text-gray-500">{archivo.nombreArchivo}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    archivo.tipo === 'plantilla' 
                                                        ? 'bg-teal-100 text-teal-700' 
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {archivo.tipo === 'plantilla' ? 'Plantilla' : 'Descargable'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/api/documents/step-file/${archivo.nombreArchivo}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-600 hover:text-brand-teal hover:bg-white rounded"
                                                    title="Descargar"
                                                >
                                                    <Icon name="download" className="text-[16px]" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!confirm('¿Eliminar este archivo?')) return;
                                                        try {
                                                            await stepService.deleteArchivo(archivo.id);
                                                            toast.success('Archivo eliminado');
                                                            setArchivosPaso(prev => prev.filter(a => a.id !== archivo.id));
                                                        } catch (error) {
                                                            console.error('Error deleting file:', error);
                                                            toast.error('Error al eliminar archivo');
                                                        }
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded"
                                                    title="Eliminar"
                                                >
                                                    <Icon name="delete" className="text-[16px]" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No hay archivos para este paso.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </FormModal>
    );
};
