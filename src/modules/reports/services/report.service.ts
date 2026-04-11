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

    async exportFlowUsage(): Promise<void> {
        await this.downloadFile('/workflows/reporte/uso/export', `Reporte_Flujos_En_Uso_${new Date().toISOString().split('T')[0]}.xlsx`);
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

    async exportFlowOpenTickets(flujoId: number, fechaInicio?: string, fechaFin?: string, estado?: string, regionalId?: number): Promise<void> {
        const params = new URLSearchParams();
        params.append('flujoId', String(flujoId));
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        if (estado) params.append('estado', estado);
        if (regionalId) params.append('regionalId', String(regionalId));

        await this.downloadFile(`/tickets/export/flow-open?${params.toString()}`, `Reporte_Flujo_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async getTicketReport(dateFrom?: string, dateTo?: string, status?: string): Promise<any> {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (status) params.append('status', status);

        const queryString = params.toString();
        const url = queryString ? `/tickets/report?${queryString}` : '/tickets/report';
        const response = await api.get<any>(url);
        return response.data;
    }

    async exportTicketReport(dateFrom?: string, dateTo?: string, status?: string): Promise<void> {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (status) params.append('status', status);

        const queryString = params.toString();
        const url = queryString ? `/tickets/export/report?${queryString}` : '/tickets/export/report';
        const filename = `Reporte_Tickets_${dateFrom || ''}_${dateTo || ''}.xlsx`.replace(/ /g, '_');
        await this.downloadFile(url, filename);
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
