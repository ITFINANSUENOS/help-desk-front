import { useState } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { type ViaticoConcepto, type UpdateConceptoDto } from '../services/viaticos.service';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UpdateConceptoDto) => Promise<void>;
    concepto: ViaticoConcepto | null;
}

const CATEGORIAS_OPTIONS = [
    { value: 'manutencion', label: 'Manutención' },
    { value: 'alojamiento', label: 'Alojamiento' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'otro', label: 'Otro' },
];

export function EditConceptoModal({ isOpen, onClose, onSubmit, concepto }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UpdateConceptoDto>(
        concepto ? {
            nombre: concepto.nombre,
            categoria: concepto.categoria,
            tope_diario: concepto.topeDiario,
            requiere_factura: concepto.requiereFactura,
            est: concepto.estado,
        } : {}
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (concepto) {
            setFormData({
                nombre: concepto.nombre,
                categoria: concepto.categoria,
                tope_diario: concepto.topeDiario,
                requiere_factura: concepto.requiereFactura,
                est: concepto.estado,
            });
        }
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Editar Concepto de Viático"
            submitText="Guardar"
            loading={loading}
            size="md"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Concepto
                    </label>
                    <Input
                        value={formData.nombre || ''}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                            categoria: value as UpdateConceptoDto['categoria'] 
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

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="estado"
                        checked={formData.est === 1}
                        onChange={(e) => setFormData({ 
                            ...formData, 
                            est: e.target.checked ? 1 : 0 
                        })}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="estado" className="text-sm text-gray-700">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
