import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Button } from '../../../shared/components/Button';
import type { Step, CreateStepDto, StepSignature } from '../interfaces/Step';
import type { StepTemplateField } from '../interfaces/TemplateField';
import { stepService } from '../services/step.service';
import { positionService } from '../../../shared/services/catalog.service';
import type { Position } from '../../../shared/interfaces/Catalog';
import { templateService } from '../../templates/services/template.service';
import { companyService } from '../../companies/services/company.service';
import { toast } from 'sonner';
import { SignatureConfig } from './SignatureConfig';
import { TemplateFieldsConfig } from './TemplateFieldsConfig';
import { SpecificAssignmentConfig } from './SpecificAssignmentConfig';
import { PdfPickerModal } from './PdfCoordinatePicker/PdfPickerModal';
import type { PlacementMarker } from './PdfCoordinatePicker/types';
import { Icon } from '../../../shared/components/Icon';
import { Tooltip } from '../../../shared/components/Tooltip';

interface Company {
    id: number;
    nombre: string;
}

interface FlujoPlantillaTemplate {
    id: number;
    empresaId: number;
    empresa: Company;
    nombrePlantilla: string;
}

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
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
    const [plantillas, setPlantillas] = useState<FlujoPlantillaTemplate[]>([]);
    const [selectedPlantilla, setSelectedPlantilla] = useState<FlujoPlantillaTemplate | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState<'firma' | 'campo'>('firma');
    const [pickerTarget, setPickerTarget] = useState<'firmas' | 'campos'>('firmas');
    const [pickerEditingIndex, setPickerEditingIndex] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const attachmentInputRef = useRef<HTMLInputElement>(null);



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
        companyService.getCompanies({ limit: 100 }).then(res => setCompanies(res.data || [])).catch(console.error);
    };

    // Load attachments when editing a step
    useEffect(() => {
        if (isEdit && step?.id) {
            loadAttachments(step.id);
        } else {
            setAttachments([]);
        }
    }, [isEdit, step?.id]);

    const loadAttachments = async (stepId: number) => {
        try {
            const data = await stepService.getStepAttachments(stepId);
            setAttachments(data);
        } catch (err) {
            console.error('Error loading attachments:', err);
        }
    };

    // Load plantillas when empresaId changes
    const loadPlantillas = async (empresaId: number) => {
        try {
            const data = await templateService.getTemplates(flujoId);
            const filtered = (data || []).filter((t: any) => t.empresa?.id === empresaId);
            setPlantillas(filtered);
        } catch (err) {
            console.error('Error loading plantillas:', err);
            setPlantillas([]);
        }
    };

    const handleEmpresaChange = async (empresaId: number) => {
        setSelectedEmpresaId(empresaId);
        setSelectedPlantilla(null);
        setPdfUrl(null);
        loadPlantillas(empresaId);

        // Load existing coordinates for this step and empresa
        if (step?.id) {
            try {
                const coords = await stepService.getCoordinates(step.id, empresaId);
                setValue('firmas', coords.firmas || []);
                setValue('campos', coords.campos || []);
            } catch (err) {
                console.error('Error loading coordinates:', err);
                setValue('firmas', []);
                setValue('campos', []);
            }
        }
    };

    const handlePlantillaChange = (plantillaId: number) => {
        const plantilla = plantillas.find(p => p.id === plantillaId);
        setSelectedPlantilla(plantilla || null);
        if (plantilla) {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            setPdfUrl(`${apiUrl}/documents/flow-template/${plantilla.id}`);
        } else {
            setPdfUrl(null);
        }
    };

    const handleOpenPicker = (mode: 'firma' | 'campo', target: 'firmas' | 'campos', editingIndex?: number) => {
        if (!pdfUrl) {
            toast.error('Seleccione primero una plantilla de empresa');
            return;
        }
        setPickerMode(mode);
        setPickerTarget(target);
        setPickerEditingIndex(editingIndex ?? null);
        setPickerOpen(true);
    };

    const handlePickerSave = (data: {
        coordX: number;
        coordY: number;
        pagina: number;
        etiqueta: string;
        cargosIds: number[];
        nombre?: string;
        codigo?: string;
        tipo?: string;
        fontSize?: number;
      }) => {
        if (pickerTarget === 'firmas') {
            const currentFirmas = watch('firmas') || [];
            if (pickerEditingIndex !== null) {
                const updated = [...currentFirmas];
                updated[pickerEditingIndex] = { ...updated[pickerEditingIndex], coordX: data.coordX, coordY: data.coordY, pagina: data.pagina, etiqueta: data.etiqueta, cargosIds: data.cargosIds };
                setValue('firmas', updated);
            } else {
                setValue('firmas', [...currentFirmas, {
                    coordX: data.coordX,
                    coordY: data.coordY,
                    pagina: data.pagina,
                    etiqueta: data.etiqueta,
                    cargosIds: data.cargosIds,
                }]);
            }
        } else {
            const currentCampos = watch('campos') || [];
            if (pickerEditingIndex !== null) {
                const updated = [...currentCampos];
                updated[pickerEditingIndex] = { ...updated[pickerEditingIndex], coordX: data.coordX, coordY: data.coordY, pagina: data.pagina };
                setValue('campos', updated);
            } else {
                setValue('campos', [...currentCampos, {
                    coordX: data.coordX,
                    coordY: data.coordY,
                    pagina: data.pagina,
                    nombre: data.nombre || '',
                    codigo: data.codigo || '',
                    tipo: data.tipo || 'text',
                    fontSize: data.fontSize || 10,
                    campoTrigger: 0,
                    mostrarDiasTranscurridos: false,
                }]);
            }
        }
        setPickerOpen(false);
        setPickerEditingIndex(null);
    };

    const getMarkers = (): PlacementMarker[] => {
        if (pickerTarget === 'firmas') {
            return (watch('firmas') || []).map((f: any, idx: number) => ({
                id: `firma-${idx}`,
                pasoId: f.pasoId || 0,
                label: f.etiqueta || `Firma ${idx + 1}`,
                coordX: f.coordX,
                coordY: f.coordY,
                pagina: f.pagina || 1,
            }));
        }
        return (watch('campos') || []).map((c: any, idx: number) => ({
            id: `campo-${idx}`,
            pasoId: c.pasoId || 0,
            label: c.etiqueta || c.nombre || `Campo ${idx + 1}`,
            coordX: c.coordX,
            coordY: c.coordY,
            pagina: c.pagina || 1,
        }));
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !step?.id) return;

        setUploadingAttachment(true);
        try {
            const newAttachment = await stepService.uploadStepAttachment(step.id, file);
            setAttachments(prev => [...prev, newAttachment]);
            toast.success('Archivo subido');
        } catch (err) {
            console.error('Error uploading attachment:', err);
            toast.error('Error al subir archivo');
        } finally {
            setUploadingAttachment(false);
            if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!step?.id) return;
        try {
            await stepService.deleteStepAttachment(step.id, attachmentId);
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            toast.success('Archivo eliminado');
        } catch (err) {
            console.error('Error deleting attachment:', err);
            toast.error('Error al eliminar archivo');
        }
    };

    const isPool = watch('esPool');
    useEffect(() => {
        if (isPool) {
            setValue('cargoAsignadoId', undefined);
        }
    }, [isPool, setValue]);

    const onSubmit = async (data: CreateStepDto) => {
        try {
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

            // Include empresaId for plantilla-level coordinate storage
            if (selectedEmpresaId) {
                (data as any).empresaId = selectedEmpresaId;
            }



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
            <div className="grid grid-cols-1 gap-4">
                {/* Basic Info */}
                <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="info" className="text-blue-600" style={{ fontSize: '18px' }} />
                            <span className="text-sm font-semibold text-gray-900">Información del Paso</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <div className="flex items-center gap-1">
                                    <Input
                                        label="Orden"
                                        type="number"
                                        {...register('orden', { required: 'Requerido' })}
                                    />
                                    <Tooltip content="Orden de ejecución del paso en el flujo" position="right" />
                                </div>
                            </div>
                            <div className="col-span-3">
                                <div className="flex items-center gap-1">
                                    <Input
                                        label="Nombre del Paso"
                                        {...register('nombre', { required: 'Requerido' })}
                                        placeholder="Ej. Aprobación de Liquidación, Verificación TH, Entrega de documento"
                                    />
                                    <Tooltip content="Nombre descriptivo del paso" position="right" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-3">
                            <div className="flex items-center gap-1">
                                <label className="text-sm font-semibold text-[#121617]">Descripción</label>
                                <Tooltip content="Instrucciones detalladas para quien ejecute este paso" position="right" />
                            </div>
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
                    <div className="p-4 bg-white rounded-lg border-l-4 border-green-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="person_pin" className="text-green-600" style={{ fontSize: '18px' }} />
                            <span className="text-sm font-semibold text-gray-900">Asignación y Tiempo</span>
                            <Tooltip content="Configura cómo se asigna el trabajo y el tiempo límite" position="top" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <label className="text-sm font-semibold text-[#121617]">Cargo Asignado (Default)</label>
                                    <Tooltip content="Cargo al que se asignará el ticket por defecto" position="right" />
                                </div>
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
                                {watch('esPool') && <p className="text-xs text-amber-600 mt-1">Se ignora en modo Pool</p>}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <Input
                                        label="Tiempo SLA (Días)"
                                        type="number"
                                        {...register('tiempoHabil')}
                                        placeholder="Ej. 1"
                                    />
                                    <Tooltip content="Días hábiles para completar. Si se excede, el ticket se marca vencido." position="right" />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Flags Section */}
                    <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuraciones Adicionales</h3>

                    {/* Grupo 1: Asignación */}
                    <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
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
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                    <div className="p-4 bg-white rounded-lg border-l-4 border-green-500 shadow-sm">
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
                    <div className="p-4 bg-white rounded-lg border-l-4 border-orange-500 shadow-sm">
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
                    <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm">
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
                            <div className="mb-4 p-4 bg-white rounded-lg border-l-4 border-cyan-500 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon name="description" className="text-cyan-600" style={{ fontSize: '18px' }} />
                                    <h4 className="text-sm font-semibold text-gray-900">Empresa / Plantilla PDF</h4>
                                    <Tooltip content="Selecciona la empresa y plantilla PDF para las firmas" position="top" />
                                </div>
                                <div className="flex gap-2 items-center mb-2">
                                    <Select
                                        value={selectedEmpresaId || ''}
                                        onChange={(val) => handleEmpresaChange(Number(val))}
                                        options={companies.map(c => ({ value: c.id, label: c.nombre }))}
                                        placeholder="Seleccione empresa..."
                                    />
                                    <Select
                                        value={selectedPlantilla?.id || ''}
                                        onChange={(val) => handlePlantillaChange(Number(val))}
                                        options={plantillas.map(p => ({ value: p.id, label: p.nombrePlantilla }))}
                                        placeholder="Seleccione plantilla..."
                                        disabled={!selectedEmpresaId}
                                    />
                                </div>
                                {pdfUrl && (
                                    <Button type="button" size="sm" variant="outline" onClick={() => handleOpenPicker('firma', 'firmas')}>
                                        <Icon name="edit" className="mr-1 text-[16px]" />
                                        Seleccionar coordenadas en PDF
                                    </Button>
                                )}
                            </div>

                            <SignatureConfig
                                firmas={(watch('firmas') || []) as unknown as StepSignature[]}
                                onChange={(newFirmas) => {
                                    console.log('[StepModal] SignatureConfig onChange called with:', newFirmas);
                                    setValue('firmas', newFirmas);
                                    console.log('[StepModal] firmas after setValue:', watch('firmas'));
                                }}
                                positions={positions}
                                onOpenPdfPicker={(_coords, editingIndex) => {
                                    handleOpenPicker('firma', 'firmas', editingIndex);
                                }}
                            />
                        </div>
                    )}

                    {!!watch('requiereCamposPlantilla') && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="mb-4 p-4 bg-white rounded-lg border-l-4 border-cyan-500 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon name="description" className="text-cyan-600" style={{ fontSize: '18px' }} />
                                    <h4 className="text-sm font-semibold text-gray-900">Empresa / Plantilla PDF</h4>
                                    <Tooltip content="Selecciona la empresa y plantilla PDF para los campos" position="top" />
                                </div>
                                <div className="flex gap-2 items-center mb-2">
                                    <Select
                                        value={selectedEmpresaId || ''}
                                        onChange={(val) => handleEmpresaChange(Number(val))}
                                        options={companies.map(c => ({ value: c.id, label: c.nombre }))}
                                        placeholder="Seleccione empresa..."
                                    />
                                    <Select
                                        value={selectedPlantilla?.id || ''}
                                        onChange={(val) => handlePlantillaChange(Number(val))}
                                        options={plantillas.map(p => ({ value: p.id, label: p.nombrePlantilla }))}
                                        placeholder="Seleccione plantilla..."
                                        disabled={!selectedEmpresaId}
                                    />
                                </div>
                                {pdfUrl && (
                                    <Button type="button" size="sm" variant="outline" onClick={() => handleOpenPicker('campo', 'campos')}>
                                        <Icon name="edit" className="mr-1 text-[16px]" />
                                        Seleccionar coordenadas en PDF
                                    </Button>
                                )}
                            </div>

                            <TemplateFieldsConfig
                                campos={(watch('campos') || []) as unknown as StepTemplateField[]}
                                onChange={(newCampos) => setValue('campos', newCampos)}
                                flujoId={Number(flujoId)}
                                onOpenPdfPicker={(_coords, editingIndex) => {
                                    handleOpenPicker('campo', 'campos', editingIndex);
                                }}
                            />
                        </div>
                    )}

                    <div className="p-4 bg-white rounded-lg border-l-4 border-gray-400 shadow-sm mt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="attach_file" className="text-gray-600" style={{ fontSize: '18px' }} />
                            <span className="text-sm font-semibold text-gray-900">Plantillas / Archivos del Paso</span>
                        </div>

                        {isEdit && attachments.length > 0 && (
                            <div className="mb-3 space-y-2">
                                {attachments.map(attachment => (
                                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Icon name="description" className="text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{attachment.nombreOriginal}</p>
                                                <p className="text-xs text-gray-500">{(attachment.tamano / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={`/api/workflows/steps/${step.id}/attachments/${attachment.id}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-brand-blue"
                                            >
                                                <Icon name="download" className="text-lg" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAttachment(attachment.id)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <Icon name="delete" className="text-lg" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                ref={attachmentInputRef}
                                onChange={handleAttachmentUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => attachmentInputRef.current?.click()}
                                disabled={!isEdit || uploadingAttachment}
                            >
                                <Icon name="add" className="mr-1 text-[16px]" />
                                {uploadingAttachment ? 'Subiendo...' : 'Agregar Archivo'}
                            </Button>
                            {!isEdit && (
                                <span className="text-xs text-gray-500">Guarde el paso primero para subir archivos</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <Input
                                label="Nombre de Adjunto Requerido"
                                {...register('nombreAdjunto')}
                                placeholder="Si requiere archivo, nombre aquí..."
                            />
                            <Tooltip content="Nombre del archivo que se requiere adjuntar en este paso (solo informativo)" position="right" />
                        </div>
                    </div>
                </div>
                </div>
            </div>
            <PdfPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                pdfUrl={pdfUrl || ''}
                markers={getMarkers()}
                mode={pickerMode}
                positions={positions}
                onSave={handlePickerSave}
            />
        </FormModal>
    );
};
