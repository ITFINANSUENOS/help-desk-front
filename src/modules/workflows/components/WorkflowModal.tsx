import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Workflow, CreateWorkflowDto } from '../interfaces/Workflow';
import { workflowService } from '../services/workflow.service';
import { subcategoryService } from '../../subcategories/services/subcategory.service';
import type { Subcategory } from '../../subcategories/interfaces/Subcategory';
import { toast } from 'sonner';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { UserSelect } from '../../users/components/UserSelect';

interface WorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    workflow?: Workflow | null; // If present, edit mode
}

export const WorkflowModal = ({ isOpen, onClose, onSuccess, workflow }: WorkflowModalProps) => {
    const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<CreateWorkflowDto>();
    const isEdit = !!workflow;
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Load subcategories
            subcategoryService.getAll().then(setSubcategories).catch(console.error);

            if (workflow) {
                // Fetch full details
                workflowService.getWorkflow(workflow.id)
                    .then(fullWorkflow => {
                        reset({
                            nombre: fullWorkflow.nombre,
                            subcategoriaId: fullWorkflow.subcategoriaId || fullWorkflow.subcategoria?.id,
                            nombreAdjunto: fullWorkflow.nombreAdjunto,
                            observadoresIds: fullWorkflow.usuariosObservadores?.map(u => u.id) || []
                        });
                    })
                    .catch(error => {
                        console.error("Error loading workflow details:", error);
                        toast.error("Error al cargar detalles del flujo");
                    });
            } else {
                reset({ nombre: '', subcategoriaId: undefined, nombreAdjunto: '', observadoresIds: [] });
            }
        }
    }, [isOpen, workflow, reset]);

    const onSubmit = async (data: CreateWorkflowDto) => {
        try {
            // Ensure ID is number
            data.subcategoriaId = Number(data.subcategoriaId);

            // Auto-generate name based on subcategory
            const selectedSub = subcategories.find(s => s.id === data.subcategoriaId);
            if (selectedSub) {
                data.nombre = `Flujo - ${selectedSub.nombre}`;
            } else {
                data.nombre = `Flujo - ${data.subcategoriaId}`; // Fallback
            }

            if (isEdit && workflow) {
                await workflowService.updateWorkflow(workflow.id, data);
                toast.success('Flujo actualizado correctamente');
            } else {
                await workflowService.createWorkflow(data);
                toast.success('Flujo creado correctamente');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar el flujo (verifique si la subcategoría ya tiene un flujo)');
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar Flujo' : 'Crear Nuevo Flujo'}
            onSubmit={handleSubmit(onSubmit)}
            loading={isSubmitting}
            submitText={isEdit ? 'Actualizar' : 'Crear'}
        >
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="subcategoriaId" className="text-[#121617] text-sm font-semibold">Subcategoría</label>
                    <Controller
                        name="subcategoriaId"
                        control={control}
                        rules={{ required: 'La subcategoría es obligatoria' }}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={subcategories.map(sub => ({
                                    value: sub.id,
                                    label: `${sub.nombre} - ${sub.categoria?.nombre}`
                                }))}
                                onChange={(val) => field.onChange(val)}
                                placeholder="Seleccione una subcategoría"
                                error={errors.subcategoriaId?.message}
                            />
                        )}
                    />
                    {errors.subcategoriaId && <p className="text-red-500 text-xs mt-1">{errors.subcategoriaId.message}</p>}
                </div>

                <Input
                    label="Nombre de Adjunto (Opcional)"
                    id="nombreAdjunto"
                    {...register('nombreAdjunto')}
                    placeholder="Ej: Informe Técnico"
                    className="w-full"
                />

                <div className="flex flex-col gap-2">
                    <label className="text-[#121617] text-sm font-semibold">Observadores (Opcional)</label>
                    <Controller
                        name="observadoresIds"
                        control={control}
                        render={({ field }) => (
                            <UserSelect
                                value={field.value}
                                onChange={field.onChange}
                                isMulti={true}
                                placeholder="Seleccione observadores..."
                            />
                        )}
                    />
                </div>
            </div>
        </FormModal>
    );
};
