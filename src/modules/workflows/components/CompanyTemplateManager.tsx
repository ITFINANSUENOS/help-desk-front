import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { IconUpload, IconTrash, IconFileAnalytics } from '@tabler/icons-react';
import { templateService } from '../../templates/services/template.service';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Select } from '../../../shared/components/Select';
import { companyService } from '../../companies/services/company.service';

interface CompanyTemplateManagerProps {
    flujoId: number;
}

interface TemplateData {
    id: number;
    empresa: {
        id: number;
        nombre: string;
    };
    nombrePlantilla: string;
    estado: number;
}

export const CompanyTemplateManager = ({ flujoId }: CompanyTemplateManagerProps) => {
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Form state for upload
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<{ empresaId: number, file: FileList }>();

    useEffect(() => {
        loadData();
    }, [flujoId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [data, companiesRes] = await Promise.all([
                templateService.getTemplates(flujoId),
                companyService.getCompanies({ limit: 100 })
            ]);
            setTemplates(data || []);
            setCompanies(companiesRes.data || []);
        } catch (error) {
            console.error("Error loading data", error);
            toast.error("Error al cargar datos");
        } finally {
            setIsLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await templateService.getTemplates(flujoId);
            setTemplates(data || []);
        } catch (error) {
            console.error("Error loading templates", error);
        }
    }

    const onSubmit = async (data: { empresaId: number, file: FileList }) => {
        if (!data.file || data.file.length === 0) {
            toast.error("Seleccione un archivo PDF");
            return;
        }
        if (!data.empresaId) {
            toast.error("Seleccione una empresa");
            return;
        }

        setIsUploading(true);
        try {
            await templateService.createTemplate(flujoId, Number(data.empresaId), data.file[0]);
            toast.success("Plantilla subida correctamente");
            reset();
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error("Error al subir la plantilla");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Seguro que desea eliminar esta plantilla?")) return;
        try {
            await templateService.deleteTemplate(id);
            toast.success("Plantilla eliminada");
            loadTemplates();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <IconFileAnalytics size={20} className="text-brand-primary" />
                    Nueva Plantilla por Empresa
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-end flex-wrap">
                    <div className="w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                        <Controller
                            name="empresaId"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={companies.map(c => ({ value: c.id, label: c.nombre }))}
                                    onChange={(val) => field.onChange(val)}
                                    placeholder="Seleccione..."
                                    error={errors.empresaId ? 'Requerido' : undefined}
                                />
                            )}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Archivo PDF</label>
                        <input
                            type="file"
                            accept=".pdf"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/90"
                            {...register('file', { required: true })}
                        />
                    </div>
                    <Button type="submit" variant="brand" disabled={isUploading}>
                        <IconUpload size={18} className="mr-2" />
                        {isUploading ? 'Subiendo...' : 'Subir Plantilla'}
                    </Button>
                </form>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">Plantillas Activas</h3>
                </div>
                <DataTable
                    columns={[
                        {
                            key: 'empresa',
                            header: 'Empresa',
                            render: (item: TemplateData) => <span className="font-medium text-gray-900">{item.empresa?.nombre}</span>
                        },
                        {
                            key: 'archivo',
                            header: 'Archivo',
                            render: (item: TemplateData) => (
                                <a
                                    href={`/document/formato/${item.nombrePlantilla}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {item.nombrePlantilla}
                                </a>
                            )
                        },
                        {
                            key: 'acciones',
                            header: 'Acciones',
                            render: (item: TemplateData) => (
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                                    title="Eliminar"
                                >
                                    <IconTrash size={18} />
                                </button>
                            )
                        }
                    ]}
                    data={templates}
                    loading={isLoading}
                    pagination={{
                        page: 1, limit: 100, total: templates.length, totalPages: 1, onPageChange: () => { }
                    }}
                    getRowKey={(item) => item.id}
                />
            </div>
        </div>
    );
};
