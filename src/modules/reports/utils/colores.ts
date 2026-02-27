// Colores del sistema (coherentes con el diseño de la app)
export const COLORES_SISTEMA = {
    verde: { bg: '#C6EFCE', text: '#006100', tailwind: 'bg-green-100 text-green-800' },
    amarillo: { bg: '#FFEB9C', text: '#9C6500', tailwind: 'bg-yellow-100 text-yellow-800' },
    rojo: { bg: '#FFC7CE', text: '#C00000', tailwind: 'bg-red-100 text-red-800' },
};

export type Clasificacion = 'verde' | 'amarillo' | 'rojo';

// Cumplimiento SLA y Score (>= 90 verde | >= 75 amarillo | < 75 rojo)
export const getClasificacionCumplimiento = (valor: number): Clasificacion =>
    valor >= 90 ? 'verde' : valor >= 75 ? 'amarillo' : 'rojo';

// Errores (invertido: <= 5 verde | <= 15 amarillo | > 15 rojo)
export const getClasificacionErrores = (valor: number): Clasificacion =>
    valor <= 5 ? 'verde' : valor <= 15 ? 'amarillo' : 'rojo';

// Cuellos de botella por duración promedio
export const getClasificacionCuello = (duracion: number): Clasificacion =>
    duracion >= 100 ? 'rojo' : duracion >= 50 ? 'amarillo' : 'verde';

// Novedades por % de tickets afectados
export const getClasificacionNovedades = (pct: number): Clasificacion =>
    pct >= 30 ? 'rojo' : pct >= 15 ? 'amarillo' : 'verde';

// Tiempo promedio por percentil dentro de un array
export const getClasificacionTiempo = (valor: number, todos: number[]): Clasificacion => {
    const sorted = [...todos].sort((a, b) => a - b);
    const idx = sorted.indexOf(valor);
    const pct = (idx / sorted.length) * 100;
    return pct <= 33 ? 'verde' : pct <= 66 ? 'amarillo' : 'rojo';
};

// Obtener clases Tailwind según clasificación
export const getTailwindClasificacion = (c: Clasificacion) => COLORES_SISTEMA[c].tailwind;

// Colores para recharts (hex directo)
export const getHexClasificacion = (c: Clasificacion) => ({
    verde: '#22c55e',
    amarillo: '#eab308',
    rojo: '#ef4444',
}[c]);

// Errores graves sobre tickets (invertido — 0 = verde, cualquier valor > 5 = rojo)
export const getColorErroresGraves = (pct: number): Clasificacion =>
    pct === 0 ? 'verde' :
        pct <= 5 ? 'amarillo' :
            'rojo';

// Errores leves sobre tickets (umbral más permisivo)
export const getColorErroresLeves = (pct: number): Clasificacion =>
    pct <= 10 ? 'verde' :
        pct <= 25 ? 'amarillo' :
            'rojo';
