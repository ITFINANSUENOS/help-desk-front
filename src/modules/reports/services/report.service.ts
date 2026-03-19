import { api } from "../../../core/api/api";

interface Regional {
    reg_id: number;
    reg_nom: string;
}

interface FlowOpenTicketsData {
    flujo: {
        flujo_id: number;
        flujo_nom: string;
        cats_id: number;
        cats_nom: string;
    };
    pasos: {
        paso_id: number;
        paso_nombre: string;
        paso_orden: number;
        tickets_count: number;
        tickets: {
            tick_id: number;
            tick_titulo: string;
            fech_crea: string;
            paso_nombre: string;
            dias_abierto: number;
        }[];
    }[];
    total_tickets: number;
    filtros: {
        fechaInicio?: string;
        fechaFin?: string;
        estado: string;
        regionalId?: number;
    };
}

class ReportService {
    async exportPerformance(): Promise<void> {
        await this.downloadFile('/tickets/export/performance', `Reporte_Desempeno_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async exportComments(): Promise<void> {
        await this.downloadFile('/tickets/export/comments', `Reporte_Comentarios_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async getFlowOpenTickets(flujoId: number, fechaInicio?: string, fechaFin?: string, estado?: string, regionalId?: number): Promise<FlowOpenTicketsData> {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        if (estado) params.append('estado', estado);
        if (regionalId) params.append('regionalId', String(regionalId));
        
        const queryString = params.toString();
        const url = queryString 
            ? `/tickets/flow-open/${flujoId}?${queryString}` 
            : `/tickets/flow-open/${flujoId}`;
        
        const response = await api.get<FlowOpenTicketsData>(url);
        return response.data;
    }

    async getRegionales(): Promise<Regional[]> {
        const response = await api.get<Regional[]>('/tickets/regionals');
        return response.data;
    }

    async exportFlowOpenTickets(flujoId: number): Promise<void> {
        await this.downloadFile(`/tickets/export/flow-open?flujoId=${flujoId}`, `Reporte_Flujo_Abiertos_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    private async downloadFile(url: string, filename: string): Promise<void> {
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

export const reportService = new ReportService();
