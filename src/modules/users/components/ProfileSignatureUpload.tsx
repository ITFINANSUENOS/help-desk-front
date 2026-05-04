import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { userService } from '../services/user.service';
import { toast } from 'sonner';
import { useAuth } from '../../auth/context/useAuth';

export const ProfileSignatureUpload: React.FC = () => {
    const { user } = useAuth();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.id) {
            loadSignature();
        }
    }, [user?.id]);

    const loadSignature = async () => {
        if (!user?.id) return;
        try {
            const url = userService.getProfileSignatureUrl(user.id) + `?t=${Date.now()}`;
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 0) {
                    const objectUrl = URL.createObjectURL(blob);
                    setPreviewUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev); // Cleanup previous
                        return objectUrl;
                    });
                }
            } else {
                setPreviewUrl(null);
            }
        } catch (error) {
            console.error('Error loading signature:', error);
            setPreviewUrl(null);
        }
    };

    // Cleanup object URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', file.name, file.size, file.type);
        toast.info(`Archivo seleccionado: ${file.name}`);

        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            toast.error('Solo se permiten archivos PNG o JPG');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error('El archivo debe ser menor a 2MB');
            return;
        }

        if (!user?.id) return;

        setIsUploading(true);
        try {
            console.log('Uploading signature for user:', user.id, file);
            toast.info('Subiendo firma...');
            await userService.uploadProfileSignature(user.id, file);
            toast.success('Firma actualizada correctamente');
            await loadSignature(); // Reload preview
        } catch (error) {
            console.error('Error uploading signature:', error);
            toast.error('Error al subir la firma');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">
                Firma Digital
            </h3>

            <div className="flex flex-col items-center gap-4">
                {previewUrl ? (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                        <img
                            src={previewUrl}
                            alt="Firma actual"
                            className="h-32 object-contain"
                        />
                    </div>
                ) : (
                    <div className="h-32 w-full max-w-xs border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 bg-gray-50">
                        Sin firma configurada
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg"
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        variant="secondary"
                        type="button"
                    >
                        {isUploading ? 'Subiendo...' : (previewUrl ? 'Cambiar Firma' : 'Subir Firma')}
                    </Button>
                    <p className="mt-2 text-xs text-gray-500">
                        Formatos: PNG, JPG (Max 2MB)
                    </p>
                </div>
            </div>
        </div>
    );
};
