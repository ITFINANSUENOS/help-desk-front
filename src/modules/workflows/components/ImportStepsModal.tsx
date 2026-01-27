import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormModal } from '../../../shared/components/FormModal';
import { Button } from '../../../shared/components/Button';
import { IconUpload, IconFileSpreadsheet } from '@tabler/icons-react';
import { stepService } from '../services/step.service';
import { toast } from 'sonner';

interface ImportStepsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    flujoId: number;
}

interface ImportForm {
    file: FileList;
}

export const ImportStepsModal = ({ isOpen, onClose, onSuccess, flujoId }: ImportStepsModalProps) => {
    const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ImportForm>();
    const [fileName, setFileName] = useState<string | null>(null);

    const onSubmit = async (data: ImportForm) => {
        if (!data.file || data.file.length === 0) {
            toast.error('Seleccione un archivo Excel');
            return;
        }

        try {
            await stepService.importSteps(flujoId, data.file[0]);
            toast.success('Pasos importados correctamente');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al importar pasos');
        }
    };

    const handleClose = () => {
        reset();
        setFileName(null);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Carga Masiva de Pasos"
            onSubmit={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="md"
            submitText="Importar"
        >
            <div className="space-y-4 py-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-2">
                    <IconFileSpreadsheet className="shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-semibold mb-1">Instrucciones</p>
                        <p>Suba un archivo Excel (.xlsx) con la estructura requerida para crear múltiples pasos a la vez. Los pasos existentes serán mantenidos, los nuevos se agregarán al final.</p>
                    </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        id="excel-upload"
                        className="hidden"
                        {...register('file', {
                            required: 'El archivo es requerido',
                            onChange: handleFileChange
                        })}
                    />
                    <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <IconUpload size={48} className="text-gray-400 mb-2" />
                        <span className="text-gray-700 font-medium">
                            {fileName || 'Haga clic para seleccionar el archivo Excel'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">Soporta .xlsx y .xls</span>
                    </label>
                </div>
                {errors.file && (
                    <p className="text-red-500 text-xs mt-1">{errors.file.message}</p>
                )}

                <div className="flex justify-center">
                    <Button type="button" variant="ghost" size="sm" onClick={() => window.open('/template_pasos.xlsx', '_blank')}>
                        Descargar Plantilla Base
                    </Button>
                </div>
            </div>
        </FormModal>
    );
};
