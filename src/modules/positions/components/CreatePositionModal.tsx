import { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { positionService } from '../services/position.service';
import type { CreatePositionDto } from '../interfaces/Position';

interface CreatePositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreatePositionModal({ isOpen, onClose, onSuccess }: CreatePositionModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const dto: CreatePositionDto = {
                nombre
            };
            await positionService.createPosition(dto);
            setNombre('');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating position:', err);
            setError(err.response?.data?.message || 'Error al crear el cargo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Nuevo Cargo"
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
                        {isLoading ? 'Crear' : 'Crear Cargo'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
