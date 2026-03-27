import React, { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { UserSelect } from '../../users/components/UserSelect';
import { toast } from 'sonner';

import { Modal } from '../../../shared/components/Modal';
import { Icon } from '../../../shared/components/Icon';
import type { ParallelTask } from '../interfaces/Ticket';

// Helper to compute the display name for a parallel task
const getTaskDisplayName = (task: ParallelTask): string | undefined => {
    if (task.asignadoNombre) return task.asignadoNombre;
    if (task.usuario) {
        const name = `${task.usuario.nombre || ''} ${task.usuario.apellido || ''}`.trim();
        return name || undefined;
    }
    return undefined;
};

interface ReassignTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: {
        nuevoUsuarioId: number;
        tipoAsignacion: 'principal' | 'paralelo';
        paraleloId?: number;
        comentario?: string;
        crearNuevoParalelo?: boolean;
    }) => void;
    isLoading?: boolean;
    isParallelStep: boolean;
    currentAssignee: string;
    parallelTasks?: ParallelTask[];
}

export const ReassignTicketModal: React.FC<ReassignTicketModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    isParallelStep,
    currentAssignee,
    parallelTasks = [],
}) => {
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [comment, setComment] = useState('');
    const [parallelSelections, setParallelSelections] = useState<Record<number, string>>({});
    const [showAddNew, setShowAddNew] = useState(false);
    const [newParallelUser, setNewParallelUser] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setSelectedUser('');
            setComment('');
            setShowAddNew(false);
            setNewParallelUser('');
            if (isParallelStep && parallelTasks.length > 0) {
                const initialSelections: Record<number, string> = {};
                parallelTasks.forEach((task) => {
                    initialSelections[task.id] = String(task.usuarioId);
                });
                setParallelSelections(initialSelections);
            }
        }
    }, [isOpen, isParallelStep, parallelTasks]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isParallelStep) {
            // First, handle reassignments of existing tasks
            const changedTasks = parallelTasks.filter(
                (task) => parallelSelections[task.id] && parallelSelections[task.id] !== String(task.usuarioId)
            );

            changedTasks.forEach((task) => {
                onConfirm({
                    nuevoUsuarioId: Number(parallelSelections[task.id]),
                    tipoAsignacion: 'paralelo',
                    paraleloId: task.id,
                    comentario: comment || undefined,
                });
            });

            // Then, handle creation of new parallel task if needed
            if (showAddNew && newParallelUser) {
                onConfirm({
                    nuevoUsuarioId: Number(newParallelUser),
                    tipoAsignacion: 'paralelo',
                    comentario: comment || undefined,
                    crearNuevoParalelo: true,
                });
            }

            if (changedTasks.length === 0 && (!showAddNew || !newParallelUser)) {
                if (showAddNew && newParallelUser) {
                    // New parallel task will be created
                } else {
                    toast.warning('No ha realizado ningún cambio');
                    return;
                }
            }
        } else {
            if (!selectedUser) {
                toast.warning('Debe seleccionar un usuario');
                return;
            }
            onConfirm({
                nuevoUsuarioId: Number(selectedUser),
                tipoAsignacion: 'principal',
                comentario: comment || undefined,
            });
        }
    };

    const handleParallelUserChange = (paraleloId: number, userId: string) => {
        setParallelSelections((prev) => ({
            ...prev,
            [paraleloId]: userId,
        }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reasignar Ticket"
            className="max-w-lg"
        >
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                    <Icon name="swap_horiz" className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p>
                            <strong>Asignado actualmente:</strong> {currentAssignee}
                        </p>
                        {isParallelStep && (
                            <p className="mt-1">
                                Este ticket tiene {parallelTasks.length} tareas paralelas.
                            </p>
                        )}
                    </div>
                </div>

                <form id="reassignForm" onSubmit={handleSubmit} className="space-y-4">
                    {isParallelStep ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Tareas Paralelas - Seleccione el nuevo usuario para cada tarea:
                            </label>
                            {parallelTasks.map((task) => (
                                <div key={task.id} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${task.estado === 'Completado' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                        <span className="text-sm font-medium text-gray-700">
                                            {getTaskDisplayName(task) || `Usuario (ID: ${task.usuarioId})`}
                                        </span>
                                        <span className="text-xs text-gray-500">({task.estado})</span>
                                    </div>
                                    <UserSelect
                                        value={parallelSelections[task.id] ? Number(parallelSelections[task.id]) : undefined}
                                        onChange={(val) => handleParallelUserChange(task.id, val ? String(val) : '')}
                                        placeholder="Reasignar a..."
                                    />
                                </div>
                            ))}

                            {/* Option to add new parallel task */}
                            {!showAddNew ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAddNew(true)}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-2"
                                >
                                    <Icon name="add_circle" className="text-lg" />
                                    Agregar nueva tarea paralela
                                </button>
                            ) : (
                                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-blue-700">
                                            Nueva Tarea Paralela
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddNew(false);
                                                setNewParallelUser('');
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <Icon name="close" className="text-lg" />
                                        </button>
                                    </div>
                                    <UserSelect
                                        value={newParallelUser ? Number(newParallelUser) : undefined}
                                        onChange={(val) => setNewParallelUser(val ? String(val) : '')}
                                        placeholder="Seleccionar usuario para nueva tarea..."
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nuevo Usuario:
                            </label>
                            <UserSelect
                                value={selectedUser ? Number(selectedUser) : undefined}
                                onChange={(val) => setSelectedUser(val ? String(val) : '')}
                                placeholder="Buscar usuario..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comentario (Opcional):
                        </label>
                        <textarea
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-3"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Motivo de la reasignación..."
                            disabled={isLoading}
                        />
                    </div>
                </form>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="brand"
                        type="submit"
                        form="reassignForm"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : 'Confirmar'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
