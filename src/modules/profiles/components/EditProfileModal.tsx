import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { profileService } from '../services/profile.service';
import type { Profile, UpdateProfileDto } from '../interfaces/Profile';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    profile: Profile | null;
}

export function EditProfileModal({ isOpen, onClose, onSuccess, profile }: EditProfileModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [nombre, setNombre] = useState('');
    const [estado, setEstado] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setNombre(profile.nombre);
            setEstado(profile.estado);
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setError(null);
        setIsLoading(true);

        try {
            const dto: UpdateProfileDto = {
                nombre,
                estado
            };
            await profileService.updateProfile(profile.id, dto);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Perfil"
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <Input
                    label="Nombre del Perfil"
                    placeholder="Ej. Técnico Nivel 1..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <Select
                        value={estado}
                        onChange={(val) => setEstado(Number(val ?? 1))}
                        options={[
                            { value: 1, label: 'Activo' },
                            { value: 0, label: 'Inactivo' }
                        ]}
                    />
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
