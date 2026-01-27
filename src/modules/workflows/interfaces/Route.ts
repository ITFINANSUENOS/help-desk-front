export interface Route {
    id: number;
    flujoId: number;
    nombre: string;
    descripcion?: string;
    // Relations if needed
    pasos?: RouteStep[];
}

export interface RouteStep {
    id: number;
    rutaId: number;
    pasoId: number;
    orden: number;
    paso?: { id: number; nombre: string; orden: number };
}

export interface CreateRouteDto {
    flujoId: number;
    nombre: string;
    descripcion?: string;
}

export interface UpdateRouteDto extends Partial<CreateRouteDto> { }
