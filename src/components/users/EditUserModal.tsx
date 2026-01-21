import { useState } from 'react';
import type { User, UpdateUserDto } from '../../interfaces/User';
import { userService } from '../../services/user.service';
import { UserForm } from './UserForm';

interface EditUserModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !user) return null;

    const handleSubmit = async (data: UpdateUserDto) => {
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        <UserForm
                            user={user}
                            onSubmit={handleSubmit}
                            onCancel={onClose}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
