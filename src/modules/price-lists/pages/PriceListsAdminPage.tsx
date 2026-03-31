import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { DataTable } from '../../../shared/components/DataTable';
import { FilterBar, type FilterConfig } from '../../../shared/components/FilterBar';
import { Select } from '../../../shared/components/Select';
import { CreatePriceListModal } from '../components/CreatePriceListModal';
import { priceListService, type PriceListConfig } from '../services/price-list.service';
import type { ListaPrecio, CreateListaPrecioDto } from '../interfaces/PriceList';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Icon } from '../../../shared/components/Icon';
import { departmentService } from '../../../shared/services/catalog.service';
import { subcategoryService } from '../../subcategories/services/subcategory.service';
import type { Subcategory } from '../../subcategories/interfaces/Subcategory';

interface Stats {
  general: number;
  promocional: number;
  finansuenos: number;
  total: number;
  vigentes: number;
}

interface Department {
  id: number;
  nombre: string;
}

export default function PriceListsAdminPage() {
  const { setTitle } = useLayout();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [priceLists, setPriceLists] = useState<ListaPrecio[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ general: 0, promocional: 0, finansuenos: 0, total: 0, vigentes: 0 });

  // Config state
  const [config, setConfig] = useState<PriceListConfig[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [ticketSubcategoryId, setTicketSubcategoryId] = useState<number | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    setTitle('Admin Listas de Precios');
  }, [setTitle]);

  const loadDepartments = useCallback(async () => {
    try {
      const depts = await departmentService.getAllActive();
      setDepartments(depts.map((d: any) => ({ id: d.id, nombre: d.nombre })));
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const configData = await priceListService.getConfig();
      setConfig(configData);
      // Use the first config's subcategoriaId (same for all)
      if (configData.length > 0) {
        setTicketSubcategoryId(configData[0].subcategoriaId || null);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, []);

  const loadSubcategories = useCallback(async () => {
    try {
      const subs = await subcategoryService.getAll();
      setSubcategories(subs);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const allLists = await priceListService.getAll({ limit: 1000 });
      const counts = { general: 0, promocional: 0, finansuenos: 0, total: allLists.data.length, vigentes: 0 };
      allLists.data.forEach((lista) => {
        if (lista.tipo === 'general') counts.general++;
        if (lista.tipo === 'promocional') counts.promocional++;
        if (lista.tipo === 'finansuenos') counts.finansuenos++;
        if (lista.esVigente === 1) counts.vigentes++;
      });
      setStats(counts);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadPriceLists = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (tipoFilter !== 'all') params.tipo = tipoFilter;

      const response = await priceListService.getAll(params);
      setPriceLists(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading price lists:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tipoFilter, page, limit]);

  useEffect(() => {
    loadConfig();
    loadDepartments();
    loadSubcategories();
  }, [loadConfig, loadDepartments, loadSubcategories]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPriceLists();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadPriceLists, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, tipoFilter]);

  const handleCreate = async (data: CreateListaPrecioDto) => {
    setLoading(true);
    try {
      await priceListService.create(data);
      await loadPriceLists();
      await loadStats();
    } catch (error) {
      console.error('Error creating price list:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (tipo: string, newDeptId: number) => {
    setConfig((prev) =>
      prev.map((c) => (c.tipo === tipo ? { ...c, departamentoId: newDeptId } : c))
    );
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      for (const entry of config) {
        await priceListService.updateConfig(entry.tipo, entry.departamentoId, ticketSubcategoryId);
      }
      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSavingConfig(false);
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

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'promocional': return 'bg-green-100 text-green-800';
      case 'finansuenos': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateRange = (inicio: string | null, fin: string | null) => {
    if (!inicio && !fin) return '-';
    const f = (d: string) => new Date(d).toLocaleDateString('es-CO');
    return `${inicio ? f(inicio) : '...'} - ${fin ? f(fin) : '...'}`;
  };

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept?.nombre || `Departamento ${deptId}`;
  };

  const columns = [
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (p: ListaPrecio) => p.descripcion || '-',
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (p: ListaPrecio) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoBadgeColor(p.tipo)}`}>
          {getTipoLabel(p.tipo)}
        </span>
      ),
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      render: (p: ListaPrecio) => formatDateRange(p.fechaInicio, p.fechaFin),
    },
    {
      key: 'esVigente',
      header: 'Estado',
      render: (p: ListaPrecio) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          p.esVigente === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {p.esVigente === 1 ? 'Vigente' : 'Histórico'}
        </span>
      ),
    },
    {
      key: 'fechaCreacion',
      header: 'Fecha',
      render: (p: ListaPrecio) => new Date(p.fechaCreacion).toLocaleDateString('es-CO'),
    },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      name: 'search',
      placeholder: 'Buscar por descripción...',
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
        { label: 'General', value: 'general' },
        { label: 'Promocional', value: 'promocional' },
        { label: 'Finansueños', value: 'finansuenos' },
      ],
    },
  ];

  const departmentOptions = departments.map((d) => ({
    value: d.id.toString(),
    label: d.nombre,
  }));

  const subcategoryOptions = [
    { value: '', label: 'Seleccione una subcategoría' },
    ...subcategories.map((s) => ({
      value: s.id.toString(),
      label: `${s.nombre} ${s.categoria ? `(${s.categoria.nombre})` : ''}`,
    })),
  ];

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Listas de Precios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Panel de administración y configuración de listas de precios.
          </p>
        </div>
        <Button variant="brand" onClick={() => setShowCreateModal(true)}>
          <Icon name="add" className="mr-2" />
          Nueva Lista
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Listas</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">General</div>
          <div className="text-2xl font-bold text-blue-600">{stats.general}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Promocional</div>
          <div className="text-2xl font-bold text-green-600">{stats.promocional}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Finansueños</div>
          <div className="text-2xl font-bold text-purple-600">{stats.finansuenos}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Vigentes</div>
          <div className="text-2xl font-bold text-brand-blue">{stats.vigentes}</div>
        </div>
      </div>

      {/* Notification Configuration - Dynamic */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Configuración de Notificaciones</h3>
          <Button variant="brand" size="sm" onClick={saveConfig} disabled={savingConfig}>
            {savingConfig ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.map((entry) => (
            <div key={entry.tipo} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="font-medium text-blue-900 mb-2 capitalize">
                Listas {getTipoLabel(entry.tipo)}
              </div>
              <Select
                value={entry.departamentoId.toString()}
                onChange={(val) => handleConfigChange(entry.tipo, parseInt(val as string))}
                options={departmentOptions}
              />
              <div className="mt-2 text-xs text-blue-600">
                Notifica a: {getDepartmentName(entry.departamentoId)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Configuración de Tickets de Error</h3>
          <Button variant="brand" size="sm" onClick={saveConfig} disabled={savingConfig}>
            {savingConfig ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="font-medium text-red-900 mb-2">Subcategoría para Reporte de Errores</div>
          <p className="text-sm text-red-600 mb-4">
            Cuando un usuario reporta un error en una lista de precios, se creará un ticket con esta subcategoría.
          </p>
          <Select
            value={ticketSubcategoryId?.toString() || ''}
            onChange={(val) => setTicketSubcategoryId(val ? parseInt(val as string) : null)}
            options={subcategoryOptions}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-4">
        <Link
          to="/price-lists"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <Icon name="list" />
          Ver todas las listas
        </Link>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
          <Icon name="history" />
          Historial de cambios
        </button>
      </div>

      <CreatePriceListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
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