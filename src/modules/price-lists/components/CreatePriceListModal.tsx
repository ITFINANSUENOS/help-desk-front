import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Icon } from '../../../shared/components/Icon';
import { priceListService } from '../services/price-list.service';
import type { ListaPrecio, CreateListaPrecioDto } from '../interfaces/PriceList';

interface CreatePriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListaPrecioDto) => Promise<void>;
  priceList?: ListaPrecio | null;
}

export function CreatePriceListModal({ isOpen, onClose, onSubmit, priceList }: CreatePriceListModalProps) {
  const [loading, setLoading] = useState(false);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [showNewMarca, setShowNewMarca] = useState(false);
  const [formData, setFormData] = useState<CreateListaPrecioDto>({
    marca: '',
    nombre: '',
    tipo: 'venta',
    fechaVigencia: '',
    archivoUrl: '',
    archivoNombre: '',
  });

  useEffect(() => {
    if (isOpen) {
      priceListService.getMarcas().then(setMarcas).catch(console.error);
      
      if (priceList) {
        setFormData({
          marca: priceList.marca,
          nombre: priceList.nombre || '',
          tipo: priceList.tipo,
          fechaVigencia: priceList.fechaVigencia || '',
          archivoUrl: priceList.archivoUrl || '',
          archivoNombre: priceList.archivoNombre || '',
        });
      } else {
        setFormData({
          marca: '',
          nombre: '',
          tipo: 'venta',
          fechaVigencia: '',
          archivoUrl: '',
          archivoNombre: '',
        });
        setShowNewMarca(false);
      }
    }
  }, [isOpen, priceList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving price list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        archivoNombre: file.name,
        archivoUrl: URL.createObjectURL(file),
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={priceList ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            {showNewMarca ? (
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                placeholder="Ej: SAMSUNG"
                required
              />
            ) : (
              <div className="flex gap-2">
                <select
                  value={formData.marca}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setShowNewMarca(true);
                    } else {
                      setFormData(prev => ({ ...prev, marca: e.target.value }));
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar marca</option>
                  {marcas.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="__NEW__">+ Nueva marca</option>
                </select>
                {formData.marca && (
                  <button
                    type="button"
                    onClick={() => setShowNewMarca(true)}
                    className="px-3 py-2 text-gray-500 hover:text-brand-blue"
                    title="Editar marca"
                  >
                    <Icon name="edit" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Lista *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'venta' | 'costos' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              required
            >
              <option value="venta">Precio de Venta (Asesores)</option>
              <option value="costos">Costos y Protección (Sistemas/Financiero)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre (Opcional)
          </label>
          <input
            type="text"
            value={formData.nombre || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="Descripción adicional de la lista"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Vigencia
          </label>
          <input
            type="date"
            value={formData.fechaVigencia || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, fechaVigencia: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Archivo PDF *
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            required={!priceList}
          />
          {formData.archivoNombre && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <Icon name="check_circle" className="text-sm" />
              {formData.archivoNombre}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={loading}>
            {loading ? (
              <>
                <Icon name="sync" className="animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Icon name="save" className="mr-2" />
                {priceList ? 'Actualizar' : 'Crear'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
