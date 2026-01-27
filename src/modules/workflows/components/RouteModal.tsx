import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import type { Route, CreateRouteDto } from '../interfaces/Route';
import { routeService } from '../services/route.service';
import { toast } from 'sonner';

interface RouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    route: Route | null;
    flujoId: number;
}

export const RouteModal = ({ isOpen, onClose, onSuccess, route, flujoId }: RouteModalProps) => {
    const isEdit = !!route;

    // Reset values helper
    const defaultValues = useMemo(() => ({
        flujoId: flujoId,
        nombre: '',
        descripcion: ''
    }), [flujoId]);

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateRouteDto>({
        defaultValues
    });

    useEffect(() => {
        if (isOpen) {
            if (route) {
                reset({
                    flujoId: route.flujoId,
                    nombre: route.nombre,
                    descripcion: route.descripcion || ''
                });
            } else {
                reset(defaultValues);
            }
        }
    }, [isOpen, route, defaultValues, reset]);

    const onSubmit = async (data: CreateRouteDto) => {
        try {
            if (isEdit && route) {
                await routeService.updateRoute(route.id, data);
                toast.success('Ruta actualizada');
            } else {
                await routeService.createRoute(data);
                toast.success('Ruta creada');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar la ruta');
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar Ruta' : 'Nueva Ruta'}
            onSubmit={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="md"
        >
            <div className="space-y-4">
                <Input
                    label="Nombre de la Ruta"
                    placeholder="Ej. Ruta Aprobación Gerencial"
                    {...register('nombre', { required: 'El nombre es obligatorio' })}
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#121617]">Descripción (Opcional)</label>
                    <textarea
                        {...register('descripcion')}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none transition-all resize-none h-24"
                        placeholder="Descripción breve del propósito de esta ruta..."
                    />
                </div>
            </div>
        </FormModal>
    );
};
