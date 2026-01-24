import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { organigramaService } from '../services/organigrama.service';
import { positionService } from '../../positions/services/position.service';
import type { Position } from '../../positions/interfaces/Position';
import type { CreateOrganigramaDto } from '../interfaces/Organigrama';

interface AddRelationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddRelationModal({ isOpen, onClose, onSuccess }: AddRelationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [positions, setPositions] = useState<Position[]>([]);
    const [cargoId, setCargoId] = useState<number>(0); // Subordinado
    const [jefeCargoId, setJefeCargoId] = useState<number>(0); // Jefe
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadPositions();
            setCargoId(0);
            setJefeCargoId(0);
            setError(null);
        }
    }, [isOpen]);

    const loadPositions = async () => {
        try {
            const { data } = await positionService.getPositions({ limit: 1000, estado: 1 });
            setPositions(data);
        } catch (err) {
            console.error('Error loading positions:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cargoId === 0 || jefeCargoId === 0) {
            setError('Debe seleccionar ambos cargos');
            return;
        }

        if (cargoId === jefeCargoId) {
            setError('El cargo y el jefe no pueden ser el mismo');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const dto: CreateOrganigramaDto = {
                cargoId,
                jefeCargoId,
                estado: 1
            };
            await organigramaService.create(dto);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating relation:', err);
            setError(err.response?.data?.message || 'Error al crear la relación');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Agregar Relación Jerárquica"
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo Jefe (Superior)
                        </label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-teal focus:ring-brand-teal"
                            value={jefeCargoId}
                            onChange={(e) => setJefeCargoId(Number(e.target.value))}
                        >
                            <option value={0}>Seleccione el jefe...</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center text-gray-400">
                        <span className="material-symbols-outlined">arrow_downward</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo Subordinado
                        </label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-teal focus:ring-brand-teal"
                            value={cargoId}
                            onChange={(e) => setCargoId(Number(e.target.value))}
                        >
                            <option value={0}>Seleccione el subordinado...</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="brand"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Guardar' : 'Crear Relación'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
