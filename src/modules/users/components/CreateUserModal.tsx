import { useState } from 'react';
import type { CreateUserDto } from '../interfaces/User';
import { userService } from '../services/user.service';
import { UserForm } from './UserForm';
import { Modal } from '../../../shared/components/Modal';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: CreateUserDto | import('../interfaces/User').UpdateUserDto) => {
        try {
            setIsLoading(true);
            setError(null);
            await userService.createUser(data as CreateUserDto);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating user:', err);
            setError(err.response?.data?.message || 'Error al crear el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Usuario"
            className="max-w-2xl"
        >
            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    {error}
                </div>
            )}

            <UserForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={isLoading}
            />
        </Modal>
    );
}
