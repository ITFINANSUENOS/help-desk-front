import { api } from '../../../core/api/api';
import type { ExcelData } from '../interfaces/ExcelData';

export const excelDataService = {
    getByFlow: async (flujoId: number): Promise<ExcelData[]> => {
        const response = await api.get<ExcelData[]>(`/excel-data/flow/${flujoId}`);
        return response.data;
    },

    getColumns: async (id: number): Promise<string[]> => {
        const response = await api.get<string[]>(`/excel-data/${id}/columns`);
        return response.data;
    },

    upload: async (flujoId: number, file: File): Promise<ExcelData> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('flujoId', flujoId.toString());

        const response = await api.post<ExcelData>('/excel-data/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/excel-data/${id}`);
    }
};
