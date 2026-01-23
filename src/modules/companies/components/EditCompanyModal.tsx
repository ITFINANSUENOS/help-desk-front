import { useEffect, useState } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import type { Company, UpdateCompanyDto } from '../interfaces/Company';

interface EditCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: UpdateCompanyDto) => Promise<void>;
    company: Company | null;
}

export function EditCompanyModal({ isOpen, onClose, onSubmit, company }: EditCompanyModalProps) {
    const [formData, setFormData] = useState<UpdateCompanyDto>({
        nombre: '',
        estado: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (company) {
            setFormData({
                nombre: company.nombre,
                estado: company.estado
            });
        }
    }, [company]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        setError(null);
        setLoading(true);

        try {
            await onSubmit(company.id, formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Editar Empresa"
            submitText="Guardar Cambios"
            loading={loading}
            size="md"
        >
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <Input
                    label="Nombre de la Empresa"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    disabled={loading}
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="edit-estado"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="edit-estado" className="text-sm font-medium text-gray-700">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
