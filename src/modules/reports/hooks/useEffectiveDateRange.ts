import type { DateRange } from '../components/ui/FiltroFecha';
export function useEffectiveDateRange(dateRange?: DateRange): DateRange {
    if (dateRange?.dateFrom || dateRange?.dateTo) return dateRange;
    return {
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
    };
}