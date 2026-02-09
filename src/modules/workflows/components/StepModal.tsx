import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
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
            if (data.cargoAsignadoId) data.cargoAsignadoId = Number(data.cargoAsignadoId);
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
                                placeholder="Ej. Aprobación Gerencia"
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
                                    <ReactQuill
                                        theme="snow"
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        className="[&_.ql-container]:min-h-[100px] [&_.ql-editor]:min-h-[100px] text-sm"
                                        placeholder="Instrucciones para este paso..."
                                    />
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Assignment & SLA */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cargo Asignado (Default)</label>
                    <select
                        {...register('cargoAsignadoId')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                        <option value="">-- Seleccionar --</option>
                        {positions.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
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
                    <select
                        {...register('campoReferenciaJefeId')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                        <option value="">-- Seleccionar Campo --</option>
                        {Array.isArray(templateFields) && templateFields.map(f => (
                            <option key={f.id} value={f.id}>{f.etiqueta} ({f.codigo})</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">Usado para determinar jefe inmediato dinámicamente.</p>
                </div>

                {/* Flags Section */}
                <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuraciones Adicionales</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esAprobacion')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Es Aprobación</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esTareaNacional')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Tarea Nacional</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            {/* Note: manually handled in onSubmit to number */}
                            <input type="checkbox" {...register('requiereSeleccionManual')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Selección Manual</span>
                        </label>

                        {/* Show Specific Assignment Config when manual selection is enabled */}
                        {!!watch('requiereSeleccionManual') && (
                            <div className="col-span-full mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Usuarios y Cargos Específicos</h4>
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
                            <input type="checkbox" {...register('necesitaAprobacionJefe')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Aprueba Jefe</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('requiereFirma')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Requiere Firma</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('permiteCerrar')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Permite Cerrar</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('asignarCreador')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Asignar a Creador</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('esParalelo')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Es Paralelo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('cerrarTicketObligatorio')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Cerrar Ticket Obligatorio</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('permiteDespachoMasivo')} className="rounded text-brand-teal focus:ring-brand-teal" />
                            <span className="text-sm text-gray-700">Permite Despacho Masivo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('requiereCamposPlantilla')} className="rounded text-brand-teal focus:ring-brand-teal" />
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
                                        <span className="material-symbols-outlined text-[20px]">upload</span>
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
