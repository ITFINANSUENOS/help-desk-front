import { api } from '../../../core/api/api';

export interface ViaticoConcepto {
    id: number;
    empresaId: number;
    nombre: string;
    categoria: 'manutencion' | 'alojamiento' | 'transporte' | 'otro';
    topeDiario: number;
    requiereFactura: boolean;
    estado: number;
    fechaCreacion: string;
    fechaModificacion: string;
}

export interface CreateConceptoDto {
    empresa_id: number;
    nombre: string;
    categoria: 'manutencion' | 'alojamiento' | 'transporte' | 'otro';
    tope_diario?: number;
    requiere_factura?: boolean;
}

export interface UpdateConceptoDto {
    nombre?: string;
    categoria?: 'manutencion' | 'alojamiento' | 'transporte' | 'otro';
    tope_diario?: number;
    requiere_factura?: boolean;
    est?: number;
}

class ViaticosService {
    // Conceptos
    async getConceptos(empresaId?: number): Promise<ViaticoConcepto[]> {
        const params = empresaId ? `?empresaId=${empresaId}` : '';
        const response = await api.get<ViaticoConcepto[]>(`/viaticos/conceptos${params}`);
        return response.data;
    }

    async getConcepto(id: number): Promise<ViaticoConcepto> {
        const response = await api.get<ViaticoConcepto>(`/viaticos/conceptos/${id}`);
        return response.data;
    }

    async createConcepto(data: CreateConceptoDto): Promise<ViaticoConcepto> {
        const response = await api.post<ViaticoConcepto>('/viaticos/conceptos', data);
        return response.data;
    }

    async updateConcepto(id: number, data: UpdateConceptoDto): Promise<ViaticoConcepto> {
        const response = await api.patch<ViaticoConcepto>(`/viaticos/conceptos/${id}`, data);
        return response.data;
    }

    async deleteConcepto(id: number): Promise<void> {
        await api.delete(`/viaticos/conceptos/${id}`);
    }
}

export const viaticosService = new ViaticosService();
