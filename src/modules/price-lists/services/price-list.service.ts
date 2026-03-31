import { api } from '../../../core/api/api';
import type { ListaPrecio, CreateListaPrecioDto, UpdateListaPrecioDto } from '../interfaces/PriceList';

export interface PriceListConfig {
  id: number;
  tipo: 'general' | 'promocional' | 'finansuenos';
  departamentoId: number;
  subcategoriaId?: number | null;
}

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
    tipo?: string;
    es_vigente?: number;
  }): Promise<PaginatedResponse<ListaPrecio>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.tipo) queryParams.set('filter[tipo]', params.tipo);
    if (params?.es_vigente !== undefined) queryParams.set('filter[es_vigente]', params.es_vigente.toString());

    const response = await api.get(`/price-lists?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<ListaPrecio> {
    const response = await api.get(`/price-lists/${id}`);
    return response.data;
  }

  async getVigente(tipo: string): Promise<ListaPrecio | null> {
    const response = await api.get(`/price-lists/vigente?tipo=${tipo}`);
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

  async getConfig(): Promise<PriceListConfig[]> {
    const response = await api.get('/price-lists/config');
    return response.data;
  }

  async updateConfig(tipo: string, departamentoId: number, subcategoriaId?: number | null): Promise<void> {
    await api.put(`/price-lists/config/${tipo}`, { departamentoId, subcategoriaId });
  }

  async updateTicketSubcategory(subcategoriaId: number | null): Promise<void> {
    // Update all price list configs with the same subcategoriaId
    const configs = await this.getConfig();
    for (const config of configs) {
      await api.put(`/price-lists/config/${config.tipo}`, { departamentoId: config.departamentoId, subcategoriaId });
    }
  }
}

export const priceListService = new PriceListService();
