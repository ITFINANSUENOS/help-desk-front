import { api } from '../../../core/api/api';
import type { ListaPrecio, CreateListaPrecioDto, UpdateListaPrecioDto } from '../interfaces/PriceList';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class PriceListService {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    marca?: string;
    tipo?: string;
    es_vigente?: number;
  }): Promise<PaginatedResponse<ListaPrecio>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.marca) queryParams.set('filter[marca]', params.marca);
    if (params?.tipo) queryParams.set('filter[tipo]', params.tipo);
    if (params?.es_vigente !== undefined) queryParams.set('filter[es_vigente]', params.es_vigente.toString());

    const response = await api.get(`/price-lists?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<ListaPrecio> {
    const response = await api.get(`/price-lists/${id}`);
    return response.data;
  }

  async getMarcas(): Promise<string[]> {
    const response = await api.get('/price-lists/marcas');
    return response.data.data;
  }

  async getByMarca(marca: string, tipo?: string): Promise<ListaPrecio[]> {
    const queryParams = tipo ? `?tipo=${tipo}` : '';
    const response = await api.get(`/price-lists/marca/${marca}${queryParams}`);
    return response.data.data;
  }

  async getVigente(marca: string, tipo: string = 'venta'): Promise<ListaPrecio | null> {
    const response = await api.get(`/price-lists/marca/${marca}/vigente?tipo=${tipo}`);
    return response.data.data;
  }

  async create(data: CreateListaPrecioDto): Promise<ListaPrecio> {
    const response = await api.post('/price-lists', data);
    return response.data;
  }

  async update(id: number, data: UpdateListaPrecioDto): Promise<ListaPrecio> {
    const response = await api.put(`/price-lists/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/price-lists/${id}`);
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    const response = await api.get(url, { responseType: 'blob' });
    const mimeType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
}

export const priceListService = new PriceListService();
