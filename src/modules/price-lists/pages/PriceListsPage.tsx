import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { priceListService } from '../services/price-list.service';
import { CreatePriceListModal } from '../components/CreatePriceListModal';
import type { ListaPrecio, CreateListaPrecioDto } from '../interfaces/PriceList';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Icon } from '../../../shared/components/Icon';

export default function PriceListsPage() {
  const { setTitle } = useLayout();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [priceListToDelete, setPriceListToDelete] = useState<ListaPrecio | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [marcaFilter, setMarcaFilter] = useState<string>('all');
  const [vigenteFilter, setVigenteFilter] = useState<string>('all');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [priceLists, setPriceLists] = useState<ListaPrecio[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle('Listas de Precios');
  }, [setTitle]);

  const loadMarcas = useCallback(async () => {
    try {
      const marcasData = await priceListService.getMarcas();
      setMarcas(marcasData);
    } catch (error) {
      console.error('Error loading marcas:', error);
    }
  }, []);

  useEffect(() => {
    loadMarcas();
  }, [loadMarcas]);

  const loadPriceLists = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (tipoFilter !== 'all') params.tipo = tipoFilter;
      if (marcaFilter !== 'all') params.marca = marcaFilter;
      if (vigenteFilter !== 'all') params.es_vigente = parseInt(vigenteFilter);

      const response = await priceListService.getAll(params);
      setPriceLists(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading price lists:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tipoFilter, marcaFilter, vigenteFilter, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, tipoFilter, marcaFilter, vigenteFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPriceLists();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [loadPriceLists, searchQuery]);

  const handleCreate = async (data: CreateListaPrecioDto) => {
    setLoading(true);
    try {
      await priceListService.create(data);
      await loadPriceLists();
      await loadMarcas();
    } catch (error) {
      console.error('Error creating price list:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (priceList: ListaPrecio) => {
    setPriceListToDelete(priceList);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (priceListToDelete) {
      setLoading(true);
      try {
        await priceListService.delete(priceListToDelete.id);
        await loadPriceLists();
      } catch (error) {
        console.error('Error deleting price list:', error);
        throw error;
      } finally {
        setLoading(false);
        setShowDeleteDialog(false);
        setPriceListToDelete(null);
      }
    }
  };

  const handleDownload = async (priceList: ListaPrecio) => {
    if (priceList.archivoUrl) {
      const filename = priceList.archivoNombre || `Lista_${priceList.marca}.pdf`;
      try {
        const response = await fetch(priceList.archivoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
  };

  const handleSetVigente = async (priceList: ListaPrecio) => {
    setLoading(true);
    try {
      await priceListService.update(priceList.id, { esVigente: 1 });
      await loadPriceLists();
    } catch (error) {
      console.error('Error setting as vigente:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'marca',
      header: 'Marca',
      render: (p: ListaPrecio) => (
        <span className="font-semibold text-gray-900">{p.marca}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (p: ListaPrecio) => p.nombre || '-',
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (p: ListaPrecio) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            p.tipo === 'venta'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {p.tipo === 'venta' ? 'Venta' : 'Costos'}
        </span>
      ),
    },
    {
      key: 'fechaVigencia',
      header: 'Vigencia',
      render: (p: ListaPrecio) => p.fechaVigencia || '-',
    },
    {
      key: 'esVigente',
      header: 'Estado',
      render: (p: ListaPrecio) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            p.esVigente === 1
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {p.esVigente === 1 ? 'Vigente' : 'Historico'}
        </span>
      ),
    },
    {
      key: 'fechaCreacion',
      header: 'Fecha',
      render: (p: ListaPrecio) => new Date(p.fechaCreacion).toLocaleDateString('es-CO'),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (p: ListaPrecio) => (
        <div className="flex gap-2">
          {p.archivoUrl && (
            <button
              className="text-gray-400 hover:text-brand-blue"
              onClick={() => handleDownload(p)}
              title="Descargar"
            >
              <Icon name="download" className="text-[20px]" />
            </button>
          )}
          {p.esVigente !== 1 && (
            <button
              className="text-gray-400 hover:text-green-600"
              onClick={() => handleSetVigente(p)}
              title="Marcar como vigente"
            >
              <Icon name="check_circle" className="text-[20px]" />
            </button>
          )}
          <button
            className="text-gray-400 hover:text-red-600"
            onClick={() => handleDeleteClick(p)}
            title="Eliminar"
          >
            <Icon name="delete" className="text-[20px]" />
          </button>
        </div>
      ),
    },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      name: 'search',
      placeholder: 'Buscar por marca o nombre...',
      value: searchQuery,
      onChange: (val) => setSearchQuery(val as string),
    },
    {
      type: 'select',
      name: 'tipo',
      value: tipoFilter,
      onChange: (val) => setTipoFilter(val as string),
      options: [
        { label: 'Todos los Tipos', value: 'all' },
        { label: 'Venta', value: 'venta' },
        { label: 'Costos', value: 'costos' },
      ],
    },
    {
      type: 'select',
      name: 'marca',
      value: marcaFilter,
      onChange: (val) => setMarcaFilter(val as string),
      options: [
        { label: 'Todas las Marcas', value: 'all' },
        ...marcas.map((m) => ({ label: m, value: m })),
      ],
    },
    {
      type: 'select',
      name: 'vigente',
      value: vigenteFilter,
      onChange: (val) => setVigenteFilter(val as string),
      options: [
        { label: 'Todos los Estados', value: 'all' },
        { label: 'Vigente', value: '1' },
        { label: 'Histórico', value: '0' },
      ],
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listas de Precios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las listas de precios por marca. Los coordinadores comerciales pueden subir y actualizar las listas.
          </p>
        </div>
        <Button variant="brand" onClick={() => setShowCreateModal(true)}>
          <Icon name="add" className="mr-2" />
          Nueva Lista
        </Button>
      </div>

      <CreatePriceListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setPriceListToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Lista de Precios"
        message={`¿Estás seguro de que deseas eliminar la lista de "${priceListToDelete?.marca}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmText="Eliminar"
      />

      <FilterBar filters={filterConfig} className="mb-6" />

      <DataTable
        data={priceLists}
        columns={columns}
        getRowKey={(p) => p.id}
        loading={loading}
        emptyMessage="No se encontraron listas de precios"
        loadingMessage="Cargando listas de precios..."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
        }}
      />
    </>
  );
}
