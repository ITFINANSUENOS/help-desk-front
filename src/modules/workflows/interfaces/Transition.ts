export interface Transition {
    id: number;
    pasoOrigenId: number;
    tipoDestino: 'paso' | 'ruta'; // 'paso' or 'ruta'
    pasoDestinoId?: number;
    rutaDestinoId?: number;
    
    // Relations
    pasoDestino?: { id: number; nombre: string };
    rutaDestino?: { id: number; nombre: string };
    
    // Condition
    condicionNombre: string;
    condicionClave?: string;
    
    // New fields mapped from legacy
    acciones?: any; 
}

export interface CreateTransitionDto {
    pasoOrigenId: number;
    tipoDestino: 'paso' | 'ruta';
    pasoDestinoId?: number; // Required if tipoDestino === 'paso'
    rutaDestinoId?: number; // Required if tipoDestino === 'ruta'
    condicionNombre: string;
    condicionClave?: string;
}

export interface UpdateTransitionDto extends Partial<CreateTransitionDto> {}
