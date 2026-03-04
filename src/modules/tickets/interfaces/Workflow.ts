export interface UserCandidate {
    id: number;
    nombre: string;
    apellido: string;
    cargo?: string;
    email?: string;
}

export interface DecisionOption {
    decisionId: string;
    label: string;
    targetStepId: number;
    requiresManualAssignment: boolean;
    candidates: UserCandidate[];
    templateFields?: {
        id: number;
        nombre: string;
        codigo: string;
        tipo: string;
        etiqueta?: string;
        campoQuery?: string;
        campoTrigger?: number;
        required?: boolean;
    }[];
    templateFieldsOrigin?: 'step' | 'initial';
    pdfTemplate?: string;
}

export interface CheckStartFlowResponse {
    requiresManualSelection: boolean;
    candidates: UserCandidate[];
    initialStepId: number;
    initialStepName: string;
    pdfTemplate?: string;
    templateFields?: {
        id: number;
        nombre: string;
        codigo: string;
        tipo: string;
        etiqueta?: string;
        campoQuery?: string;
        campoTrigger?: number;
        required?: boolean;
    }[];
    decisions?: DecisionOption[];
}
