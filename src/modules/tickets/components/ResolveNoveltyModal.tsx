import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { FileUploader } from '../../../shared/components/FileUploader';
import { Icon } from '../../../shared/components/Icon';

interface ResolveNoveltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (files: File[]) => void;
    isLoading?: boolean;
}

export const ResolveNoveltyModal: React.FC<ResolveNoveltyModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (isOpen) {
            setFiles([]);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        onConfirm(files);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Resolver Novedad"
            className="max-w-md"
        >
            <div className="space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-3">
                    <Icon name="check_circle" className="text-green-600 mt-0.5" />
                    <p className="text-sm text-green-800">
                        Al resolver la novedad, el ticket se reanudará y el SLA continuará su conteo normal.
                    </p>
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
