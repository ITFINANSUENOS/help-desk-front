export interface StepTemplateField {
    id?: number;
    pasoId?: number;
    nombre: string;
    codigo: string;
    tipo: string; // 'text', 'date', 'regional', 'cargo', etc.
    coordX: number;
    coordY: number;
    pagina: number;
    fontSize: number;
    campoTrigger: number; // 0 o 1
    campoQuery?: string;
    mostrarDiasTranscurridos: boolean;
    estado?: number; // 1 = activo, 0 = inactivo
}

export const FIELD_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'date', label: 'Fecha' },
    { value: 'regional', label: 'Regional' },
    { value: 'cargo', label: 'Cargo' },
    { value: 'number', label: 'Número' },
] as const;
