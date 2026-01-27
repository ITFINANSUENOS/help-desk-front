import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { IconTrash, IconArrowRight, IconRoute, IconArrowsSplit, IconPlus, IconSettings } from '@tabler/icons-react';
import type { Transition, CreateTransitionDto } from '../interfaces/Transition';
import { transitionService } from '../services/transition.service';
import { stepService } from '../services/step.service';
import type { Step } from '../interfaces/Step';
import { routeService } from '../services/route.service';
import type { Route } from '../interfaces/Route';
import { RouteModal } from './RouteModal';
import { RouteStepsModal } from './RouteStepsModal';
import { toast } from 'sonner';

interface TransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    stepOrigenId: number;
    stepOrigenNombre: string;
    flujoId: number;
}

export const TransitionModal = ({ isOpen, onClose, stepOrigenId, stepOrigenNombre, flujoId }: TransitionModalProps) => {
    const [transitions, setTransitions] = useState<Transition[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Nested Modals
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isRouteStepsModalOpen, setIsRouteStepsModalOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

    const { register, handleSubmit, watch, reset, setValue } = useForm<CreateTransitionDto>({
        defaultValues: {
            tipoDestino: 'paso',
            pasoOrigenId: stepOrigenId
        }
    });

    const tipoDestino = watch('tipoDestino');
    const selectedRouteId = watch('rutaDestinoId');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, stepOrigenId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [transitionsData, stepsData, routesData] = await Promise.all([
                transitionService.getTransitions(stepOrigenId),
                stepService.getSteps({ flujoId, limit: 100 }),
                routeService.getRoutes(flujoId)
            ]);
            setTransitions(transitionsData);
            setSteps(stepsData.data.filter(s => s.id !== stepOrigenId));
            setRoutes(routesData);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos de transiciones');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: CreateTransitionDto) => {
        try {
            await transitionService.createTransition({
                ...data,
                pasoOrigenId: stepOrigenId
            });
            toast.success('Transición añadida');
            reset({
                tipoDestino: 'paso',
                pasoOrigenId: stepOrigenId,
                condicionNombre: '',
                condicionClave: ''
            });
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al crear transición');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar transición?')) return;
        try {
            await transitionService.deleteTransition(id);
            toast.success('Transición eliminada');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
    };

    const handleCreateRoute = () => {
        setSelectedRoute(null);
        setIsRouteModalOpen(true);
    };

    const handleRouteSuccess = async () => {
        setIsRouteModalOpen(false);
        const routesData = await routeService.getRoutes(flujoId);
        setRoutes(routesData);
    };

    const handleManageRouteSteps = () => {
        if (!selectedRouteId) return;
        const route = routes.find(r => r.id === Number(selectedRouteId));
        if (route) {
            setSelectedRoute(route);
            setIsRouteStepsModalOpen(true);
        }
    };

    return (
        <>
            <FormModal
                isOpen={isOpen}
                onClose={onClose}
                title={`Transiciones: ${stepOrigenNombre}`}
                size="lg"
                showFooter={false}
            >
                <div className="space-y-6">

                    {/* List of existing transitions */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <IconArrowsSplit size={18} />
                            Transiciones Existentes
                        </h4>
                        {transitions.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay transiciones configuradas.</p>
                        ) : (
                            <div className="space-y-2">
                                {transitions.map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-full ${t.tipoDestino === 'ruta' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {t.tipoDestino === 'ruta' ? <IconRoute size={16} /> : <IconArrowRight size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {t.condicionNombre} <span className="text-xs text-gray-400 font-normal">({t.condicionClave || 'Sin clave'})</span>
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    Hacia: <span className="font-medium">
                                                        {t.tipoDestino === 'ruta' ? t.rutaDestino?.nombre : t.pasoDestino?.nombre}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add new transition form */}
                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-4">Añadir Nueva Transición</h4>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Destino</label>
                                    <div className="flex rounded-md shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setValue('tipoDestino', 'paso')}
                                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border ${tipoDestino === 'paso'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 z-10'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Paso
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue('tipoDestino', 'ruta')}
                                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${tipoDestino === 'ruta'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 z-10'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Ruta
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {tipoDestino === 'paso' ? 'Paso Destino' : 'Ruta Destino'}
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            {...register(tipoDestino === 'paso' ? 'pasoDestinoId' : 'rutaDestinoId', { required: true })}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {tipoDestino === 'paso' ? (
                                                steps.map(s => (
                                                    <option key={s.id} value={s.id}>{s.orden} - {s.nombre}</option>
                                                ))
                                            ) : (
                                                routes.map(r => (
                                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                                ))
                                            )}
                                        </select>

                                        {tipoDestino === 'ruta' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleCreateRoute}
                                                    className="px-2 py-1 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100"
                                                    title="Nueva Ruta"
                                                >
                                                    <IconPlus size={18} />
                                                </button>
                                                {selectedRouteId && (
                                                    <button
                                                        type="button"
                                                        onClick={handleManageRouteSteps}
                                                        className="px-2 py-1 bg-purple-50 text-purple-600 rounded border border-purple-200 hover:bg-purple-100"
                                                        title="Gestionar Pasos de Ruta"
                                                    >
                                                        <IconSettings size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Nombre Condición"
                                    placeholder="Ej. Aprobar"
                                    {...register('condicionNombre', { required: true })}
                                />
                                <Input
                                    label="Clave (Opcional)"
                                    placeholder="Ej. APROBADO"
                                    {...register('condicionClave')}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" variant="brand" disabled={isLoading}>
                                    Añadir Transición
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </FormModal>

            {/* Nested Modals */}
            {isRouteModalOpen && (
                <RouteModal
                    isOpen={isRouteModalOpen}
                    onClose={() => setIsRouteModalOpen(false)}
                    onSuccess={handleRouteSuccess}
                    route={selectedRoute}
                    flujoId={flujoId}
                />
            )}

            {isRouteStepsModalOpen && selectedRoute && (
                <RouteStepsModal
                    isOpen={isRouteStepsModalOpen}
                    onClose={() => setIsRouteStepsModalOpen(false)}
                    route={selectedRoute}
                    flujoId={flujoId}
                />
            )}
        </>
    );
};
