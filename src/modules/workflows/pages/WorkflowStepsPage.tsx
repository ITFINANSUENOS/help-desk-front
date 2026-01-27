import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { IconPlus, IconArrowLeft, IconPencil, IconTrash, IconArrowsSplit, IconFileSpreadsheet } from '@tabler/icons-react';
import { stepService } from '../services/step.service';
import type { Step } from '../interfaces/Step';
import { toast } from 'sonner';
import { StepModal } from '../components/StepModal';
import { TransitionModal } from '../components/TransitionModal';
import { ImportStepsModal } from '../components/ImportStepsModal';
import { workflowService } from '../services/workflow.service';
import type { Workflow } from '../interfaces/Workflow';

export const WorkflowStepsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [steps, setSteps] = useState<Step[]>([]);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<Step | null>(null);

    // Transition Modal state
    const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
    const [selectedStepForTransition, setSelectedStepForTransition] = useState<Step | null>(null);

    const workflowId = Number(id);

    useEffect(() => {
        if (!id || isNaN(workflowId)) {
            console.error("Invalid workflow ID:", id);
            toast.error("ID de flujo inválido");
            return;
        }
        loadData();
    }, [workflowId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [wf, stepsData] = await Promise.all([
                workflowService.getWorkflow(workflowId),
                stepService.getSteps({ flujoId: workflowId, limit: 100 })
            ]);
            setWorkflow(wf);
            // Sort by 'orden' just in case backend doesn't
            setSteps((stepsData.data || []).sort((a, b) => a.orden - b.orden));
        } catch (error) {
            console.error("Error loading workflow steps:", error);
            toast.error('Error al cargar datos del flujo. Revise la consola.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedStep(null);
        setIsModalOpen(true);
    };

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleEdit = (step: Step) => {
        setSelectedStep(step);
        setIsModalOpen(true);
    };

    const handleTransitions = (step: Step) => {
        setSelectedStepForTransition(step);
        setIsTransitionModalOpen(true);
    };

    const handleDelete = async (stepId: number) => {
        if (!confirm('¿Está seguro de eliminar este paso? Esta acción no se puede deshacer.')) return;

        try {
            await stepService.deleteStep(stepId);
            toast.success('Paso eliminado correctamente');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar el paso');
        }
    };

    const handleModalSuccess = () => {
        setIsModalOpen(false);
        loadData();
    };

    const handleImportSuccess = () => {
        setIsImportModalOpen(false);
        loadData();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {workflow ? `Pasos: ${workflow.nombre}` : 'Cargando...'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestione el orden y configuración de los pasos del flujo
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/workflows')}>
                        <IconArrowLeft size={20} className="mr-2" />
                        Volver
                    </Button>
                    <Button variant="outline" onClick={handleImport}>
                        <IconFileSpreadsheet size={20} className="mr-2" />
                        Carga Masiva (Excel)
                    </Button>
                    <Button variant="brand" onClick={handleCreate}>
                        <IconPlus size={20} className="mr-2" />
                        Nuevo Paso
                    </Button>
                </div>
            </div>

            <DataTable
                columns={[
                    {
                        key: 'orden',
                        header: 'Orden',
                        render: (step: Step) => <span className="font-bold text-gray-900">#{step.orden}</span>
                    },
                    {
                        key: 'nombre',
                        header: 'Nombre',
                        render: (step: Step) => step.nombre
                    },
                    {
                        key: 'cargoAsignado',
                        header: 'Cargo Asignado',
                        render: (step: Step) => step.cargoAsignado?.nombre || <span className="text-gray-400 italic">Sin asignar</span>
                    },
                    {
                        key: 'config',
                        header: 'Configuración',
                        render: (step: Step) => (
                            <div className="flex flex-wrap gap-1">
                                {step.tiempoHabil ? (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200" title="Tiempo SLA">
                                        ⏱️ {step.tiempoHabil} días
                                    </span>
                                ) : null}
                                {step.esAprobacion && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        Aprobación
                                    </span>
                                )}
                                {/* ... existing badges ... */}
                                {step.esTareaNacional && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        Nacional
                                    </span>
                                )}
                                {step.permiteCerrar === 1 && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        Cierra Ticket
                                    </span>
                                )}
                                {/* ... more badges ... */}
                            </div>
                        )
                    },
                    {
                        key: 'estado',
                        header: 'Estado',
                        render: (step: Step) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${step.estado === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {step.estado === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'Acciones',
                        render: (step: Step) => (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleTransitions(step)}
                                    className="p-1 hover:bg-purple-100 rounded text-purple-600"
                                    title="Gestionar Transiciones"
                                >
                                    <IconArrowsSplit size={18} />
                                </button>
                                <button
                                    onClick={() => handleEdit(step)}
                                    className="p-1 hover:bg-gray-100 rounded text-blue-600"
                                    title="Editar"
                                >
                                    <IconPencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(step.id)}
                                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                                    title="Eliminar"
                                >
                                    <IconTrash size={18} />
                                </button>
                            </div>
                        )
                    }
                ]}
                data={steps}
                loading={isLoading}
                getRowKey={(step) => step.id}
                pagination={{
                    page: 1,
                    limit: 100,
                    total: steps.length,
                    totalPages: 1,
                    onPageChange: () => { },
                }}
            />

            {isModalOpen && (
                <StepModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    step={selectedStep}
                    flujoId={workflowId}
                />
            )}

            {isImportModalOpen && (
                <ImportStepsModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={handleImportSuccess}
                    flujoId={workflowId}
                />
            )}

            {isTransitionModalOpen && selectedStepForTransition && (
                <TransitionModal
                    isOpen={isTransitionModalOpen}
                    onClose={() => setIsTransitionModalOpen(false)}
                    stepOrigenId={selectedStepForTransition.id}
                    stepOrigenNombre={selectedStepForTransition.nombre}
                    flujoId={workflowId}
                />
            )}
        </div>
    );
};
