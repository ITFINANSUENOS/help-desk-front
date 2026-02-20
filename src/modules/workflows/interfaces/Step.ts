import type { StepTemplateField } from './TemplateField';

export interface Step {
    id: number;
    flujoId: number;
    orden: number;
    nombre: string;
    descripcion?: string;
    cargoAsignadoId?: number;
    cargoAsignado?: { id: number; nombre: string }; // Relation
    tiempoHabil?: number; // SLA in hours
    estado: number;

    // Flags
    esAprobacion: boolean;
    esTareaNacional: boolean;
    requiereSeleccionManual?: number; // 1 or 0
    nombreAdjunto?: string;
    campoReferenciaJefeId?: number;
    permiteCerrar?: number; // 1 or 0
    necesitaAprobacionJefe?: boolean;
    esParalelo?: boolean;
    esPool?: boolean;
    requiereFirma?: boolean;
    requiereCamposPlantilla?: number; // 1 or 0
    asignarCreador?: boolean;
    cerrarTicketObligatorio?: boolean;
    permiteDespachoMasivo?: boolean;
    firmas?: StepSignature[];
    campos?: StepTemplateField[];
    usuarios?: StepSpecificUser[];
}

export interface StepSignature {
    id?: number;
    pasoId?: number;
    usuarioId?: number;
    usuario?: { id: number; nombre: string; apellido: string };
    cargoId?: number;
    cargo?: { id: number; nombre: string };
    coordX: number;
    coordY: number;
    pagina: number;
    etiqueta?: string;
}

export interface StepSpecificUser {
    id?: number;
    pasoId?: number;
    usuarioId?: number;
    usuario?: { id: number; nombre: string; apellido: string };
    cargoId?: number;
    cargo?: { id: number; nombre: string };
}

export interface CreateStepDto {
    flujoId: number;
    orden: number;
    nombre: string;

    // Optional
    cargoAsignadoId?: number;
    tiempoHabil?: number;
    descripcion?: string;

    // Checkboxes / Flags
    esAprobacion: boolean;
    esTareaNacional?: boolean;
    requiereSeleccionManual?: number;
    nombreAdjunto?: string;
    campoReferenciaJefeId?: number;
    permiteCerrar?: number;
    necesitaAprobacionJefe?: boolean;
    esParalelo?: boolean;
    esPool?: boolean;
    requiereFirma?: boolean;
    requiereCamposPlantilla?: number;
    asignarCreador?: boolean;
    cerrarTicketObligatorio?: boolean;
    permiteDespachoMasivo?: boolean;
    firmas?: StepSignature[];
    campos?: StepTemplateField[];
    usuariosEspecificos?: Array<{ usuarioId?: number; cargoId?: number }>;
}

export interface UpdateStepDto extends Partial<CreateStepDto> {
    estado?: number;
}

export interface StepFilter {
    flujoId?: number;
    search?: string;
    limit?: number;
    page?: number;
}

export interface StepListResponse {
    data: Step[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
