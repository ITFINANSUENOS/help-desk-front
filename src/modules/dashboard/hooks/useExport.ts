import { useState } from 'react';
import { toast } from 'sonner';
import { dashboardApi } from '../services/dashboard.api';

export const useExport = () => {
    const [loading, setLoading] = useState(false);

    const exportar = async (format = 'xlsx', type = 'full') => {
        setLoading(true);
        try {
            const blob = await dashboardApi.exportar(format, type);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Exportación descargada correctamente');
        } catch {
            toast.error('Error al exportar el dashboard');
        } finally {
            setLoading(false);
        }
    };

    return { exportar, loading };
};
