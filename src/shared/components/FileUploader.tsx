import React, { useRef, useState } from 'react';
import { Icon } from './Icon';

interface FileUploaderProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    label?: string;
    maxFiles?: number;
    accept?: string;
    maxIndividualSize?: number; // Bytes, default 2MB
    maxTotalSize?: number; // Bytes, default 8MB
}

import { toast } from 'sonner';

export const FileUploader: React.FC<FileUploaderProps> = ({
    files,
    onFilesChange,
    label = 'Adjuntar Archivos',
    maxFiles = 10,
    accept,
    maxIndividualSize = 2 * 1024 * 1024, // 2MB
    maxTotalSize = 8 * 1024 * 1024 // 8MB
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;
        const incomingFiles = Array.from(newFiles);
        const validFiles: File[] = [];
        const oversizedFiles: string[] = [];

        // 1. Validate Individual File Size
        incomingFiles.forEach(file => {
            if (file.size > maxIndividualSize) {
                oversizedFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        });

        if (oversizedFiles.length > 0) {
            toast.error(`Los siguientes archivos exceden el límite de ${(maxIndividualSize / 1024 / 1024).toFixed(0)}MB: ${oversizedFiles.join(', ')}`);
        }

        if (validFiles.length === 0) return;

        // 2. Validate Total Size
        const currentTotalSize = files.reduce((acc, file) => acc + file.size, 0);
        const incomingTotalSize = validFiles.reduce((acc, file) => acc + file.size, 0);

        if (currentTotalSize + incomingTotalSize > maxTotalSize) {
            const remainingSpace = maxTotalSize - currentTotalSize;
            toast.error(`El grupo de archivos excede el límite total de ${(maxTotalSize / 1024 / 1024).toFixed(0)}MB. Espacio restante: ${(remainingSpace / 1024 / 1024).toFixed(2)}MB.`);
            return;
        }

        const totalFiles = [...files, ...validFiles].slice(0, maxFiles);
        onFilesChange(totalFiles);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onFilesChange(newFiles);
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            <div
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                ${dragActive ? 'border-brand-primary bg-brand-light' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Icon name="cloud_upload" className="text-gray-400 text-3xl mb-2" />
                    <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">
                        Máx. {maxFiles} archivos. {(maxIndividualSize / 1024 / 1024).toFixed(0)}MB por archivo, {(maxTotalSize / 1024 / 1024).toFixed(0)}MB en total.
                    </p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={accept}
                    onChange={handleChange}
                />
            </div>

            {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md shadow-sm">
                            <div className="flex items-center space-x-2 truncate">
                                <Icon name="description" className="text-blue-500" />
                                <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                                <Icon name="close" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
