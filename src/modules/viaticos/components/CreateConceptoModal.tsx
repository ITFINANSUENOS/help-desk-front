import { useState } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { type CreateConceptoDto } from '../services/viaticos.service';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateConceptoDto) => Promise<void>;
}

const CATEGORIAS_OPTIONS = [
    { value: 'manutencion', label: 'Manutención' },
    { value: 'alojamiento', label: 'Alojamiento' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'otro', label: 'Otro' },
];

export function CreateConceptoModal({ isOpen, onClose, onSubmit }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateConceptoDto>({
        empresa_id: 1,
        nombre: '',
        categoria: 'manutencion',
        tope_diario: 0,
        requiere_factura: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            setFormData({
                empresa_id: 1,
                nombre: '',
                categoria: 'manutencion',
                tope_diario: 0,
                requiere_factura: true,
            });
            onClose();
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            empresa_id: 1,
            nombre: '',
            categoria: 'manutencion',
            tope_diario: 0,
            requiere_factura: true,
        });
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Nuevo Concepto de Viático"
            submitText="Crear"
            loading={loading}
            size="md"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Concepto
                    </label>
                    <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Desayuno, Alojamiento, Combustible"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                    </label>
                    <Select
                        value={formData.categoria}
                        onChange={(value) => setFormData({ 
                            ...formData, 
                            categoria: value as CreateConceptoDto['categoria'] 
                        })}
                        options={CATEGORIAS_OPTIONS}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tope Diario ($)
                    </label>
                    <Input
                        type="number"
                        value={formData.tope_diario}
                        onChange={(e) => setFormData({ 
                            ...formData, 
                            tope_diario: parseFloat(e.target.value) || 0 
                        })}
                        placeholder="0 = Sin límite"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="requiereFactura"
                        checked={formData.requiere_factura}
                        onChange={(e) => setFormData({ 
                            ...formData, 
                            requiere_factura: e.target.checked 
                        })}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="requiereFactura" className="text-sm text-gray-700">
                        Requiere factura
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
