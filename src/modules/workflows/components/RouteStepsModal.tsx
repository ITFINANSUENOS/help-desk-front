import { useEffect, useState } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Button } from '../../../shared/components/Button';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import type { Route, RouteStep } from '../interfaces/Route';
import { routeService } from '../services/route.service';
import { stepService } from '../services/step.service';
import type { Step } from '../interfaces/Step';
import { toast } from 'sonner';

interface RouteStepsModalProps {
    isOpen: boolean;
    onClose: () => void;
    route: Route; // The route being managed
    flujoId: number; // To list available steps
}

export const RouteStepsModal = ({ isOpen, onClose, route, flujoId }: RouteStepsModalProps) => {
    const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
    const [availableSteps, setAvailableSteps] = useState<Step[]>([]);
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [order, setOrder] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [rSteps, allSteps] = await Promise.all([
                routeService.getRouteSteps(route.id),
                stepService.getSteps({ flujoId, limit: 100 })
            ]);
            setRouteSteps(rSteps);
            setAvailableSteps(allSteps.data);

            // Auto-increment order based on existing steps
            const maxOrder = rSteps.reduce((max, s) => Math.max(max, s.orden), 0);
            setOrder(maxOrder + 1);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStepId) return;

        try {
            await routeService.addStepToRoute(route.id, Number(selectedStepId), order);
            toast.success('Paso añadido a la ruta');
            loadData(); // Reload to see update and reset order
            setSelectedStepId('');
        } catch (error) {
            console.error(error);
            toast.error('Error al añadir paso');
        }
    };

    const handleRemove = async (routeStepId: number) => {
        if (!confirm('¿Quitar paso de la ruta?')) return;
        try {
            await routeService.removeStepFromRoute(routeStepId);
            toast.success('Paso quitado');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al quitar paso');
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Gestionar Pasos: ${route.nombre}`}
            size="lg"
            showFooter={false}
        >
            <div className="space-y-6">

                {/* Add Step Form */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h5 className="text-sm font-bold text-blue-800 mb-3">Añadir Paso a la Secuencia</h5>
                    <form onSubmit={handleAdd} className="flex gap-4 items-end">
                        <div className="w-20">
                            <label className="block text-xs font-semibold text-blue-700 mb-1">Orden</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(Number(e.target.value))}
                                className="w-full rounded border border-blue-300 px-2 py-1.5 text-sm"
                                min="1"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-blue-700 mb-1">Paso del Flujo</label>
                            <select
                                value={selectedStepId}
                                onChange={(e) => setSelectedStepId(e.target.value)}
                                className="w-full rounded border border-blue-300 px-2 py-1.5 text-sm"
                            >
                                <option value="">-- Seleccionar Paso --</option>
                                {availableSteps.map(step => (
                                    <option key={step.id} value={step.id}>
                                        {step.nombre} (ID: {step.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" variant="brand" disabled={!selectedStepId}>
                            <IconPlus size={18} />
                            Añadir
                        </Button>
                    </form>
                </div>

                {/* List of Steps in Route */}
                <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Secuencia de Pasos</h4>
                    {routeSteps.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
                            No hay pasos en esta ruta aún.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-3 py-2 rounded-l">Orden</th>
                                    <th className="px-3 py-2">Paso</th>
                                    <th className="px-3 py-2 rounded-r w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {routeSteps
                                    .sort((a, b) => a.orden - b.orden)
                                    .map(rs => (
                                        <tr key={rs.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-bold text-gray-700">{rs.orden}</td>
                                            <td className="px-3 py-2 text-gray-800">
                                                {rs.paso?.nombre || `Paso ID: ${rs.pasoId}`}
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    onClick={() => handleRemove(rs.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Quitar de la ruta"
                                                >
                                                    <IconTrash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </FormModal>
    );
};
