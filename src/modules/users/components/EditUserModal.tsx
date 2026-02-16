import { useState } from 'react';
import type { User, UpdateUserDto } from '../interfaces/User';
import { userService } from '../services/user.service';
import { UserForm } from './UserForm';
import { Modal } from '../../../shared/components/Modal';

interface EditUserModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Note: Modal handles isOpen check, but we need user to render form.
    // If not open or no user, Modal returns null (if isOpen false) but if open and no user, we might crash.
    // Ideally user is not null if isOpen is true.

    const handleSubmit = async (data: UpdateUserDto) => {
        if (!user) return;
        try {
            setIsLoading(true);
            setError(null);
            await userService.updateUser(user.id, data);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating user:', err);
            setError(err.response?.data?.message || 'Error al actualizar el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Usuario"
            className="max-w-4xl"
        >
            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    {error}
                </div>
            )}

            {user && (
                <UserForm
                    user={user}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isLoading={isLoading}
                />
            )}
        </Modal>
    );
}
