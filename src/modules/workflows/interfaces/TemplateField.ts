/**
 * Template field reference in a step - links to a PlantillaCampo
 */
export interface StepTemplateField {
    id?: number;
    pasoId?: number;
    plantillaCampoId?: number; // Reference to PlantillaCampo (field coordinates)
    nombre: string;
    codigo: string;
    tipo: string; // 'text', 'date', 'regional', 'cargo', etc.
}

/**
 * Template signature zone - defines coordinates for a signature on a PDF template
 */
export interface TemplateSignature {
    id?: number;
    flujoPlantillaId?: number;
    coordX: number;
    coordY: number;
    pagina: number;
    etiqueta?: string; // Smart Tag (PDF Form Field Name)
    estado?: number;
}

/**
 * Template field - defines a field's position and configuration on a PDF template
 */
export interface TemplateField {
    id?: number;
    flujoPlantillaId?: number;
    nombre: string;
    codigo: string;
    tipo: string;
    coordX: number;
    coordY: number;
    etiqueta?: string;
    pagina: number;
    fontSize: number;
    campoTrigger: number;
    campoQuery?: string;
    mostrarDiasTranscurridos: boolean;
    estado?: number;
}

export const FIELD_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'date', label: 'Fecha' },
    { value: 'regional', label: 'Regional' },
    { value: 'cargo', label: 'Cargo' },
    { value: 'number', label: 'Número' },
] as const;
