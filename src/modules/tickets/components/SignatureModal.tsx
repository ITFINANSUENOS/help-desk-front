import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '../../../shared/components/Button';
import { userService } from '../../users/services/user.service';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/useAuth';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signatureBase64: string) => void;
    title?: string;
    description?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Firmar Documento',
    description = 'Por favor firme en el recuadro a continuación para autorizar esta acción.'
}) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isLoadingSignature, setIsLoadingSignature] = useState(false);
    const { user } = useAuth();

    if (!isOpen) return null;

    const handleClear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
    };

    const handleConfirm = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            // Get base64 (remove data:image/png;base64, prefix if needed, but usually we keep it for src)
            // The method toDataURL() returns full data URI.
            const dataUrl = sigCanvas.current.toDataURL('image/png');
            onConfirm(dataUrl);
            onClose();
        }
    };

    const handleEnd = () => {
        if (sigCanvas.current) {
            setIsEmpty(sigCanvas.current.isEmpty());
        }
    };

    const handleLoadProfileSignature = async () => {
        if (!user?.id) {
            toast.error('No se pudo identificar al usuario');
            return;
        }

        setIsLoadingSignature(true);
        try {
            const signatureUrl = userService.getProfileSignatureUrl(user.id);

            // Fetch the image and load it into the canvas
            const response = await fetch(signatureUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Firma de perfil no encontrada');
            }

            const blob = await response.blob();
            const img = new Image();
            const objectUrl = URL.createObjectURL(blob);

            img.onload = () => {
                if (sigCanvas.current) {
                    const canvas = sigCanvas.current.getCanvas();
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Clear canvas first
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        // Draw the image scaled to fit
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        setIsEmpty(false);
                    }
                }
                URL.revokeObjectURL(objectUrl);
                toast.success('Firma de perfil cargada');
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                toast.error('Error al cargar la imagen de la firma');
            };

            img.src = objectUrl;
        } catch (error) {
            console.error('Error loading profile signature:', error);
            toast.error('No se pudo cargar la firma de perfil');
        } finally {
            setIsLoadingSignature(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                {/* Modal Panel */}
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-4">
                                        {description}
                                    </p>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <SignatureCanvas
                                            ref={sigCanvas}
                                            penColor="black"
                                            canvasProps={{
                                                className: 'w-full h-48 rounded-lg cursor-crosshair',
                                            }}
                                            onEnd={handleEnd}
                                            backgroundColor="transparent"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        Dibuje su firma encima de la línea.
                                    </p>

                                    {/* Load Profile Signature Button */}
                                    <div className="mt-3 flex justify-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleLoadProfileSignature}
                                            disabled={isLoadingSignature}
                                        >
                                            {isLoadingSignature ? 'Cargando...' : 'Cargar firma de perfil'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                        <Button
                            variant="brand"
                            onClick={handleConfirm}
                            disabled={isEmpty}
                        >
                            Confirmar Firma
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleClear}
                            disabled={isEmpty}
                        >
                            Limpiar
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
