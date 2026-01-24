import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { positionService } from '../services/position.service';
import type { Position, UpdatePositionDto } from '../interfaces/Position';

interface EditPositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    position: Position | null;
}

export function EditPositionModal({ isOpen, onClose, onSuccess, position }: EditPositionModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [nombre, setNombre] = useState('');
    const [estado, setEstado] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (position) {
            setNombre(position.nombre);
            setEstado(position.estado);
        }
    }, [position]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!position) return;

        setError(null);
        setIsLoading(true);

        try {
            const dto: UpdatePositionDto = {
                nombre,
                estado
            };
            await positionService.updatePosition(position.id, dto);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating position:', err);
            setError(err.response?.data?.message || 'Error al actualizar el cargo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Cargo"
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <Input
                    label="Nombre del Cargo"
                    placeholder="Ej. Gerente, Analista..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-teal focus:ring-brand-teal"
                        value={estado}
                        onChange={(e) => setEstado(Number(e.target.value))}
                    >
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                    </select>
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
                        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
