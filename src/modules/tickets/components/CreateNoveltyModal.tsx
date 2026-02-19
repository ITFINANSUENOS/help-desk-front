import React, { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { UserSelect } from '../../users/components/UserSelect';
import { toast } from 'sonner';

import { Modal } from '../../../shared/components/Modal';
import { FileUploader } from '../../../shared/components/FileUploader';
import { Icon } from '../../../shared/components/Icon';

interface CreateNoveltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { usuarioAsignadoId: number; descripcion: string }, files: File[]) => void;
    isLoading?: boolean;
}

export const CreateNoveltyModal: React.FC<CreateNoveltyModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setSelectedUser('');
            setDescription('');
            setFiles([]);
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
        }, files);
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
                    <Icon name="pause_circle" className="text-orange-600 mt-0.5" />
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
                        <UserSelect
                            value={selectedUser ? Number(selectedUser) : undefined}
                            onChange={(val) => setSelectedUser(val ? String(val) : '')}
                            placeholder="Buscar usuario..."
                        // disabled={isLoading} // UserSelect doesn't have disabled prop yet, but logic handles it via form submission check
                        />
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

                    <div>
                        <FileUploader
                            files={files}
                            onFilesChange={setFiles}
                            label="Adjuntos (Opcional)"
                            maxFiles={10}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
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
