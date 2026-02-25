export const formatHoras = (horas: number | string): string => {
    // 1. Aseguramos que sea número
    const val = Number(horas);

    // 2. Protección por si llega null, undefined o NaN
    if (isNaN(val)) return '0h';

    // 3. Usamos 'val' en lugar de 'horas'
    if (val < 1) return `${Math.round(val * 60)}min`;
    if (val < 24) return `${val.toFixed(1)}h`;
    if (val < 168) return `${(val / 24).toFixed(1)} días`;
    return `${(val / 168).toFixed(1)} sem`;
};

// Tus otras funciones están bien porque ya usan Number(v)
export const formatPct = (v: number): string => `${Number(v).toFixed(1)}%`;
export const formatScore = (v: number): string => Number(v).toFixed(1);
export const formatNumero = (n: number): string => Number(n).toLocaleString('es-CO');

export const formatFecha = (iso: string): string =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });