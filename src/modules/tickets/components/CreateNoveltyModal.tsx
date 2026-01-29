import React, { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { userService } from '../../users/services/user.service';
import type { User } from '../../users/interfaces/User';
import { toast } from 'sonner';

import { Modal } from '../../../shared/components/Modal';

interface CreateNoveltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { usuarioAsignadoId: number; descripcion: string }) => void;
    isLoading?: boolean;
}

export const CreateNoveltyModal: React.FC<CreateNoveltyModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [description, setDescription] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoadingUsers(true);
            userService.getUsers({ limit: 100 }) // Fetch top 100 users for simple selection
                .then(res => setUsers(res.data))
                .catch(err => toast.error('Error al cargar usuarios'))
                .finally(() => setLoadingUsers(false));

            // Reset form
            setSelectedUser('');
            setDescription('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            toast.warning('Debe seleccionar un usuario');
            return;
        }
        if (!description.trim()) {
            toast.warning('Debe ingresar una descripción');
            return;
        }
        onConfirm({
            usuarioAsignadoId: Number(selectedUser),
            descripcion: description
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Novedad (Pausar Ticket)"
            className="max-w-lg"
        >
            <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex gap-3">
                    <span className="material-symbols-outlined text-orange-600 mt-0.5">pause_circle</span>
                    <p className="text-sm text-orange-800">
                        Crear una novedad pausará el ticket y lo asignará al usuario seleccionado para su gestión.
                        El SLA se detendrá hasta que se resuelva la novedad.
                    </p>
                </div>

                <form id="noveltyForm" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Asignar Novedad a:
                        </label>
                        <select
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm py-2"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            disabled={isLoading || loadingUsers}
                        >
                            <option value="">Seleccione un usuario...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre} {u.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción / Motivo:
                        </label>
                        <textarea
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-3"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describa la novedad..."
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
                        form="noveltyForm"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creando...' : 'Crear Novedad'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
