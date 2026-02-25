export const formatHoras = (horas: number): string => {
    if (horas < 1) return `${Math.round(horas * 60)}min`;
    if (horas < 24) return `${horas.toFixed(1)}h`;
    if (horas < 168) return `${(horas / 24).toFixed(1)} días`;
    return `${(horas / 168).toFixed(1)} sem`;
};

export const formatPct = (v: number): string => `${Number(v).toFixed(1)}%`;
export const formatScore = (v: number): string => Number(v).toFixed(1);
export const formatNumero = (n: number): string => n.toLocaleString('es-CO');

export const formatFecha = (iso: string): string =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
