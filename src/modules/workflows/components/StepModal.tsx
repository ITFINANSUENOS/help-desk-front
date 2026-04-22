import { useEffect, useState, useRef } from 'react';
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
import { TemplateFieldsConfig } from './TemplateFieldsConfig';
import { SpecificAssignmentConfig } from './SpecificAssignmentConfig';
import { Icon } from '../../../shared/components/Icon';
import { Tooltip } from '../../../shared/components/Tooltip';

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



    // Track the last loaded step ID to prevent unwanted resets during re-renders
    const lastStepIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            const currentId = step ? step.id : -1; // -1 represents 'new step' mode

            // Only load/reset data if we haven't loaded this step yet
            if (currentId !== lastStepIdRef.current) {

                lastStepIdRef.current = currentId;

                loadCatalogs();
                setPdfFile(null);

                if (step) {
                    // Fetch fresh data for step to get standard DTO structure
                    stepService.getStep(step.id).then(fullStep => {

                        reset({
                            flujoId: fullStep.flujoId,
                            orden: fullStep.orden,
                            nombre: fullStep.nombre,
                            descripcion: fullStep.descripcion,
                            cargoAsignadoId: fullStep.cargoAsignadoId,
                            tiempoHabil: fullStep.tiempoHabil,
                            campoReferenciaJefeId: fullStep.campoReferenciaJefeId,
                            esAprobacion: !!fullStep.esAprobacion,
                            esTareaNacional: !!fullStep.esTareaNacional,
                            requiereSeleccionManual: fullStep.requiereSeleccionManual,
                            nombreAdjunto: fullStep.nombreAdjunto || '',
                            permiteCerrar: fullStep.permiteCerrar,
                            necesitaAprobacionJefe: !!fullStep.necesitaAprobacionJefe,
                            esParalelo: !!fullStep.esParalelo,
                            esPool: !!fullStep.esPool,
                            requiereFirma: !!fullStep.requiereFirma,
                            requiereCamposPlantilla: fullStep.requiereCamposPlantilla,
                            asignarCreador: !!fullStep.asignarCreador,
                            cerrarTicketObligatorio: !!fullStep.cerrarTicketObligatorio,
                            permiteDespachoMasivo: !!fullStep.permiteDespachoMasivo,
                            firmas: fullStep.firmas || [],
                            campos: fullStep.campos || [],
                            usuariosEspecificos: fullStep.usuarios?.map(u => ({
                                usuarioId: u.usuarioId || undefined,
                                cargoId: u.cargoId || undefined
                            })) || []
                        });
                    }).catch(err => {
                        console.error('[StepModal] Error loading step details:', err);
                        // Fallback to basic data if fetch fails
                        reset({
                            flujoId: step.flujoId,
                            orden: step.orden,
                            nombre: step.nombre,
                            esAprobacion: !!step.esAprobacion
                        });
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
    }, [isOpen, step, flujoId, reset]);

    const loadCatalogs = () => {
        positionService.getAllActive().then(setPositions).catch(console.error);
        templateService.getAllFields().then(setTemplateFields).catch(console.error);
    };

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
            // DEBUG: Log form data to verify all fields are present



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
                            />
                        </div>
                        <div className="col-span-3">
                            <Input
                                label="Nombre del Paso"
                                {...register('nombre', { required: 'Requerido' })}
                                placeholder="Ej. Aprobación de Liquidación, Verificación TH, Entrega de documento"
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
                                description={watch('esPool') ? "Se ignora si es Pool" : "Cargo default para asignación automática"}
                            />
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <Input
                        label="Tiempo SLA (Días)"
                        type="number"
                        description="Días hábiles para completar. Afecta vencimientos."
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
                                description="Determina dinámicamente el jefe inmediato del asignado"
                            />
                        )}
                    />
                </div>

                {/* Flags Section */}
                <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuraciones Adicionales</h3>

                    {/* Grupo 1: Asignación */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="person_pin" className="text-blue-600" style={{ fontSize: '18px' }} />
                            <h4 className="text-sm font-semibold text-gray-900">Asignación</h4>
                            <Tooltip content="Configura cómo se asigna el paso a los usuarios" position="top" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('esPool')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700 font-medium">Asignación Grupo (Pool)</span>
                                <Tooltip content="Permite asignar a múltiples usuarios/cargos en lugar de uno solo" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('asignarCreador')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Asignar a Creador</span>
                                <Tooltip content="El ticket se asigna automáticamente al usuario que lo creó" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('requiereSeleccionManual')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Selección Manual</span>
                                <Tooltip content="El paso no se asigna automáticamente; requiere selección manual" position="right" />
                            </label>
                        </div>
                        {/* Show Specific Assignment Config when manual selection is enabled OR when esPool is used */}
                        {(!!watch('requiereSeleccionManual') || !!watch('esPool')) && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-900 mb-3">
                                    {watch('esPool') ? "Usuarios del Grupo (Pool)" : "Usuarios y Cargos Específicos"}
                                </h5>
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
                    </div>

                    {/* Grupo 2: Aprobación y Firma */}
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="fact_check" className="text-green-600" style={{ fontSize: '18px' }} />
                            <h4 className="text-sm font-semibold text-gray-900">Aprobación y Firma</h4>
                            <Tooltip content="Configura requisitos de aprobación y firma digital" position="top" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('esAprobacion')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Es Aprobación</span>
                                <Tooltip content="Este paso requiere aprobación explícita para continuar el flujo" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('necesitaAprobacionJefe')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Aprueba Jefe</span>
                                <Tooltip content="El jefe inmediato del asignado debe aprobar antes de continuar" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('requiereFirma')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Requiere Firma</span>
                                <Tooltip content="Requiere firma digital en documento PDF" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('esTareaNacional')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Tarea Nacional</span>
                                <Tooltip content="Aplica para todos los usuarios sin importar su regional" position="right" />
                            </label>
                        </div>
                    </div>

                    {/* Grupo 3: Cierre y Finalización */}
                    <div className="mb-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="task_alt" className="text-orange-600" style={{ fontSize: '18px' }} />
                            <h4 className="text-sm font-semibold text-gray-900">Cierre y Finalización</h4>
                            <Tooltip content="Configura cómo se cierra o finaliza el ticket en este paso" position="top" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('permiteCerrar')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Permite Cerrar</span>
                                <Tooltip content="Este paso permite cerrar el ticket directamente" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('cerrarTicketObligatorio')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Cerrar Ticket Obligatorio</span>
                                <Tooltip content="Obliga a cerrar el ticket al completar este paso" position="right" />
                            </label>
                        </div>
                    </div>

                    {/* Grupo 4: Configuración Avanzada */}
                    <div className="mb-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="settings" className="text-purple-600" style={{ fontSize: '18px' }} />
                            <h4 className="text-sm font-semibold text-gray-900">Configuración Avanzada</h4>
                            <Tooltip content="Opciones avanzadas para comportamientos específicos del paso" position="top" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('esParalelo')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Es Paralelo</span>
                                <Tooltip content="Permite que múltiples asignados trabajen simultáneamente" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('permiteDespachoMasivo')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Permite Despacho Masivo</span>
                                <Tooltip content="Permite enviar el ticket a múltiples destinos" position="right" />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('requiereCamposPlantilla')} className="rounded text-brand-teal focus:ring-brand-teal" />
                                <span className="text-sm text-gray-700">Requiere Campos Plantilla</span>
                                <Tooltip content="Requiere completar campos específicos de una plantilla" position="right" />
                            </label>
                        </div>
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

                    {!!watch('requiereCamposPlantilla') && (
                        <div className="mt-4">
                            <TemplateFieldsConfig
                                campos={(watch('campos') || []) as unknown as StepTemplateField[]}
                                onChange={(newCampos) => setValue('campos', newCampos)}
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
                </div>
            </div>
        </FormModal>
    );
};
