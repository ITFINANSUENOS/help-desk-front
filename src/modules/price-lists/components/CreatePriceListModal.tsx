import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Icon } from '../../../shared/components/Icon';
import { Select, type Option } from '../../../shared/components/Select';
import type { ListaPrecio, CreateListaPrecioDto } from '../interfaces/PriceList';
import { priceListService, type PriceListConfig } from '../services/price-list.service';
import { departmentService } from '../../../shared/services/catalog.service';

interface Department {
  id: number;
  nombre: string;
}

interface CreatePriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListaPrecioDto) => Promise<void>;
  priceList?: ListaPrecio | null;
}

const tipoOptions: Option[] = [
  { value: 'general', label: 'General' },
  { value: 'promocional', label: 'Promocional' },
  { value: 'finansuenos', label: 'Finansueños' },
];

export function CreatePriceListModal({ isOpen, onClose, onSubmit, priceList }: CreatePriceListModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<PriceListConfig[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreateListaPrecioDto>({
    descripcion: '',
    tipo: 'general',
    fechaInicio: '',
    fechaFin: '',
    archivoUrl: '',
    archivoNombre: '',
    departamentoId: undefined,
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        priceListService.getConfig(),
        departmentService.getAllActive(),
      ]).then(([cfg, depts]) => {
        setConfig(cfg);
        setDepartments(depts.map((d: any) => ({ id: d.id, nombre: d.nombre })));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (priceList) {
        setFormData({
          descripcion: priceList.descripcion || '',
          tipo: priceList.tipo,
          fechaInicio: priceList.fechaInicio || '',
          fechaFin: priceList.fechaFin || '',
          archivoUrl: priceList.archivoUrl || '',
          archivoNombre: priceList.archivoNombre || '',
          departamentoId: priceList.departamentoId || undefined,
        });
        setSelectedFile(null);
      } else {
        setFormData({
          descripcion: '',
          tipo: 'general',
          fechaInicio: '',
          fechaFin: '',
          archivoUrl: '',
          archivoNombre: '',
          departamentoId: undefined,
        });
        setSelectedFile(null);
      }
    }
  }, [isOpen, priceList]);

  // Auto-set department based on config when config loads or tipo changes
  useEffect(() => {
    if (config.length > 0 && formData.departamentoId === undefined && !priceList) {
      const defaultDept = getDefaultDepartmentId(formData.tipo);
      if (defaultDept) {
        setFormData((prev) => ({ ...prev, departamentoId: defaultDept }));
      }
    }
  }, [config, formData.tipo, priceList]);

  const getDefaultDepartmentId = (tipo: string): number | undefined => {
    const cfg = config.find((c) => c.tipo === tipo);
    return cfg?.departamentoId;
  };

  const handleTipoChange = (tipo: string) => {
    const defaultDept = getDefaultDepartmentId(tipo);
    setFormData((prev) => ({
      ...prev,
      tipo: tipo as 'general' | 'promocional' | 'finansuenos',
      departamentoId: defaultDept,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalFormData = { ...formData };

      // Si hay un archivo seleccionado, subirlo a S3 primero
      if (selectedFile) {
        setUploading(true);
        try {
          const { url, filename } = await priceListService.uploadFile(selectedFile);
          finalFormData.archivoUrl = url;
          finalFormData.archivoNombre = filename;
        } finally {
          setUploading(false);
        }
      }

      await onSubmit(finalFormData);
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
      setSelectedFile(file);
      setFormData((prev) => ({
        ...prev,
        archivoNombre: file.name,
        archivoUrl: '', // Se llenará después de subir a S3
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
          <Select
            label="Tipo de Lista *"
            value={formData.tipo}
            onChange={(value) => handleTipoChange(value as string)}
            options={tipoOptions}
            required
          />

          <Select
            label="Departamento"
            value={formData.departamentoId?.toString() || ''}
            options={departments.map((d) => ({ value: d.id.toString(), label: d.nombre }))}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input
            type="text"
            value={formData.descripcion || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="Ej: Lista promocional Samsung del 16 al 22 marzo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={formData.fechaInicio || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
            <input
              type="date"
              value={formData.fechaFin || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo (PDF o Excel) *</label>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls"
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
          <Button type="submit" variant="brand" disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Icon name="sync" className="animate-spin mr-2" />
                {uploading ? 'Subiendo archivo...' : 'Guardando...'}
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