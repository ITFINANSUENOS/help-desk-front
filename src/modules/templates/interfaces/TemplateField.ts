export interface TemplateField {
    id: number;
    etiqueta: string;
    codigo: string;
    tipo: string;
    // Add other fields as needed based on legacy 'tm_campo_plantilla'
}

export interface TemplateFieldFilter {
    search?: string;
    limit?: number;
    page?: number;
}
