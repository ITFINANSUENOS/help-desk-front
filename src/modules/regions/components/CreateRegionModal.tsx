import { useState, useEffect } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { zoneService } from '../../zones/services/zone.service';
import type { CreateRegionalDto } from '../interfaces/Region';
import type { Zone } from '../../zones/interfaces/Zone';

interface CreateRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateRegionalDto) => Promise<void>;
}

export function CreateRegionModal({ isOpen, onClose, onSubmit }: CreateRegionModalProps) {
    const [formData, setFormData] = useState<CreateRegionalDto>({
        nombre: '',
        zonaId: undefined,
        estado: 1
    });
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadDependencies();
        }
    }, [isOpen]);

    const loadDependencies = async () => {
        try {
            const z = await zoneService.getAll();
            setZones(z);
        } catch (err) {
            console.error('Error loading zones:', err);
            setError('Error al cargar zonas');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await onSubmit(formData);
            setFormData({ nombre: '', zonaId: undefined, estado: 1 });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear regional');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ nombre: '', zonaId: undefined, estado: 1 });
        setError(null);
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Crear Regional"
            submitText="Crear"
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
                    label="Nombre de la Regional"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Noroccidente"
                    required
                    disabled={loading}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                    <Select
                        value={formData.zonaId}
                        onChange={(val) => setFormData({ ...formData, zonaId: val ? Number(val) : undefined })}
                        options={zones.map(z => ({ value: z.id, label: z.nombre }))}
                        placeholder="Seleccione una zona (opcional)"
                        disabled={loading}
                        isClearable
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="create_region_estado"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="create_region_estado" className="text-sm font-medium text-gray-700">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
