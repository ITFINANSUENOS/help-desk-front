import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './Button';
import { userService } from '../../modules/users/services/user.service';
import { toast } from 'sonner';
import { useAuth } from '../../modules/auth/context/useAuth';

export interface SignatureData {
    signature: string;
    comment?: string;
}

interface UnifiedSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: SignatureData) => void;

    // Configuración visual
    title?: string;
    description?: string;

    // Funcionalidad de comentario
    showCommentField?: boolean;
    commentRequired?: boolean;
    commentLabel?: string;
    commentPlaceholder?: string;

    // Carga de firma de perfil
    enableProfileSignature?: boolean;

    // Estado
    isLoading?: boolean;
}

export const UnifiedSignatureModal: React.FC<UnifiedSignatureModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Firmar Documento',
    description = 'Por favor firme en el recuadro a continuación.',
    showCommentField = false,
    commentRequired = false,
    commentLabel = 'Comentario (Opcional)',
    commentPlaceholder = 'Escriba un comentario...',
    enableProfileSignature = true,
    isLoading = false
}) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [hasUploadedImage, setHasUploadedImage] = useState(false);
    const [comment, setComment] = useState('');
    const [isLoadingSignature, setIsLoadingSignature] = useState(false);
    const [forceManual, setForceManual] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const canUseProfileSignature = enableProfileSignature && !!user?.id && !forceManual;
    const isCanvasDisabled = canUseProfileSignature && isEmpty;

    const resetCanvas = () => {
        sigCanvas.current?.clear();
        setHasUploadedImage(false);
        setIsEmpty(true);
    };

    // Clear canvas when modal opens
    useEffect(() => {
        if (isOpen) {
            resetCanvas();
            setComment('');
            setForceManual(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClear = () => {
        resetCanvas();
        setForceManual(true);
    };

    const handleConfirm = async () => {
        if (!sigCanvas.current) return;

        let dataUrl: string | null = null;

        if (!isEmpty) {
            // User drew or uploaded an image — use canvas content
            dataUrl = sigCanvas.current.toDataURL('image/png');
        }

        // Canvas is empty but user has a saved profile signature — use it directly
        if (!dataUrl && enableProfileSignature && user?.id) {
            setIsLoadingSignature(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const signatureUrl = `${apiUrl}${userService.getProfileSignatureUrl(user.id)}`;
                const response = await fetch(signatureUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    if (blob.size > 0) {
                        dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading profile signature:', error);
            } finally {
                setIsLoadingSignature(false);
            }
        }

        if (!dataUrl) {
            toast.error('Debe dibujar su firma, subir una imagen o tener una firma guardada en su perfil');
            return;
        }

        if (showCommentField && commentRequired && !comment.trim()) {
            toast.error('El comentario es obligatorio');
            return;
        }

        onConfirm({
            signature: dataUrl,
            comment: showCommentField ? comment : undefined
        });
    };

    const handleEnd = () => {
        if (sigCanvas.current) {
            // Check if empty (no strokes) AND no custom image
            setIsEmpty(sigCanvas.current.isEmpty() && !hasUploadedImage);
        }
    };

    const drawImageOnCanvas = (img: HTMLImageElement) => {
        if (!sigCanvas.current) return;

        const canvas = sigCanvas.current.getCanvas();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Synchronize canvas internal resolution with its display size
        // Multiply by 3 to ensure high resolution for the output image (PDF stamping)
        const SCALE_FACTOR = 3;
        const rect = canvas.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width * SCALE_FACTOR;
            canvas.height = rect.height * SCALE_FACTOR;
        }

        // Clear canvas (resizing usually clears, but good to ensure)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scale to fit image within canvas with padding
        const padding = 20 * SCALE_FACTOR; // Scale padding too
        const availWidth = canvas.width - padding;
        const availHeight = canvas.height - padding;

        // Prevent division by zero
        const safeW = availWidth > 0 ? availWidth : canvas.width;
        const safeH = availHeight > 0 ? availHeight : canvas.height;

        const scale = Math.min(safeW / img.width, safeH / img.height);

        const w = img.width * scale;
        const h = img.height * scale;

        // Center the image
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        setHasUploadedImage(true);
        setIsEmpty(false);
    };

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tipo (opcional, aunque el input ya tiene accept)
        if (!file.type.match('image.*')) {
            toast.error('Solo se permiten imágenes (PNG, JPG)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                drawImageOnCanvas(img);
                toast.success('Imagen cargada como firma');
            };
            img.onerror = () => {
                toast.error('Error al procesar la imagen');
            };
            if (e.target?.result) {
                img.src = e.target.result as string;
            }
        };
        reader.readAsDataURL(file);

        // Reset input value to allow re-uploading same file if needed
        event.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={isLoading ? undefined : onClose}
                />

                {/* Modal Panel */}
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    {description}
                                </p>

                                {/* Signature Pad */}
                                <div className={`relative border-2 border-dashed rounded-lg bg-gray-50 mb-2 ${isCanvasDisabled ? 'border-brand-teal opacity-75 pointer-events-none' : 'border-gray-300'}`}>
                                    {isCanvasDisabled && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            <div className="bg-brand-teal text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium">
                                                ✓ Firma de perfil cargada
                                            </div>
                                        </div>
                                    )}
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

                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-gray-400">
                                        {isCanvasDisabled
                                            ? 'Su firma guardada se usará automáticamente al confirmar'
                                            : 'Dibuje su firma arriba *'}
                                    </span>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleClear}
                                            className="text-xs text-brand-blue hover:underline"
                                            disabled={isLoading || isLoadingSignature}
                                        >
                                            {isCanvasDisabled ? 'Dibujar manualmente' : 'Limpiar'}
                                        </button>

                                        {!isCanvasDisabled && (
                                            <button
                                                type="button"
                                                onClick={handleImageUploadClick}
                                                className="text-xs text-brand-blue hover:underline font-medium"
                                                disabled={isLoading || isLoadingSignature}
                                            >
                                                Subir Imagen
                                            </button>
                                        )}

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/png, image/jpeg"
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Comment Field */}
                                {showCommentField && (
                                    <div className="mb-2">
                                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                                            {commentLabel} {commentRequired && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea
                                            id="comment"
                                            rows={3}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2 border"
                                            placeholder={commentPlaceholder}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                        <Button
                            variant="brand"
                            onClick={handleConfirm}
                            disabled={(isEmpty && !canUseProfileSignature) || isLoading || isLoadingSignature || (showCommentField && commentRequired && !comment.trim())}
                        >
                            {isLoadingSignature ? 'Cargando firma...' : isLoading ? 'Procesando...' : 'Confirmar Firma'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading || isLoadingSignature}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
