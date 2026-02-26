import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { FileUploader } from '../../../shared/components/FileUploader';
import { Icon } from '../../../shared/components/Icon';
import { toast } from 'sonner';

interface ResolveNoveltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (description: string, files: File[]) => void;
    isLoading?: boolean;
}

export const ResolveNoveltyModal: React.FC<ResolveNoveltyModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setFiles([]);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!description.trim()) {
            toast.warning('Debe escribir una respuesta antes de resolver la novedad.');
            return;
        }
        onConfirm(description, files);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Resolver Novedad"
            className="max-w-lg"
        >
            <div className="space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-3">
                    <Icon name="check_circle" className="text-green-600 mt-0.5" />
                    <p className="text-sm text-green-800">
                        Al resolver la novedad, el ticket se reanudará y el SLA continuará su conteo normal.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Respuesta / Resolución <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-3 min-h-[120px] resize-y"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describa cómo resolvió la novedad..."
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <FileUploader
                        files={files}
                        onFilesChange={setFiles}
                        label="Adjuntar Evidencia (Opcional)"
                        maxFiles={10}
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    />
                </div>

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
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isLoading ? 'Resolviendo...' : 'Resolver Novedad'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
