import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Icon } from '../../../shared/components/Icon';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { ticketService } from '../../tickets/services/ticket.service';
import { subcategoryService } from '../../subcategories/services/subcategory.service';
import { priceListService } from '../services/price-list.service';
import type { ListaPrecio } from '../interfaces/PriceList';
import type { Subcategory } from '../../subcategories/interfaces/Subcategory';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceList: ListaPrecio | null;
}

export function ReportErrorModal({ isOpen, onClose, priceList }: ReportErrorModalProps) {
  const [loading, setLoading] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSubcategory();
    }
  }, [isOpen]);

  const loadSubcategory = async () => {
    try {
      const configs = await priceListService.getConfig();
      if (configs.length > 0 && configs[0].subcategoriaId) {
        const sub = await subcategoryService.getSubcategory(configs[0].subcategoriaId);
        setSubcategory(sub);
      }
    } catch (err) {
      console.error('Error loading subcategory:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceList) return;

    setLoading(true);
    setError(null);

    try {
      const tipoLabel = priceList.tipo === 'general' ? 'General' :
                        priceList.tipo === 'promocional' ? 'Promocional' : 'Finansueños';

      const descripcionLista = priceList.descripcion || tipoLabel;

      const ticketDescription = `
        <p><strong>Lista:</strong> ${descripcionLista}</p>
        <p><strong>Tipo:</strong> ${tipoLabel}</p>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;" />
        <p><strong>Descripción del error reportado:</strong></p>
        ${descripcion}
      `;

      await ticketService.createTicket({
        titulo: `Error en lista de precios: ${descripcionLista}`,
        descripcion: ticketDescription,
        categoriaId: subcategory?.categoriaId || 1,
        subcategoriaId: subcategory?.id || 1,
        prioridadId: subcategory?.prioridadId ?? undefined,
      }, []);

      onClose();
      setDescripcion('');
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Error al crear el ticket. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'general': return 'General';
      case 'promocional': return 'Promocional';
      case 'finansuenos': return 'Finansueños';
      default: return tipo;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reportar Error en Lista de Precios" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {priceList && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Lista:</strong> {priceList.descripcion || getTipoLabel(priceList.tipo)}
            </p>
            <p className="text-sm text-amber-800">
              <strong>Tipo:</strong> {getTipoLabel(priceList.tipo)}
            </p>
            {priceList.fechaInicio || priceList.fechaFin ? (
              <p className="text-sm text-amber-800">
                <strong>Vigencia:</strong> {priceList.fechaInicio || '...'} - {priceList.fechaFin || '...'}
              </p>
            ) : null}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion del error *
          </label>
          <RichTextEditor
            value={descripcion}
            onChange={setDescripcion}
            placeholder="Describa el error encontrado en la lista de precios (precios incorrectos, referencias faltantes, etc.)... Puede adjuntar capturas directamente en el editor."
            height={200}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={loading}>
            {loading ? (
              <>
                <Icon name="sync" className="animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Icon name="send" className="mr-2" />
                Enviar Reporte
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
