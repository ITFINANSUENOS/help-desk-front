export interface Position {
    id: number;
    nombre: string;
    estado: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePositionDto {
    nombre: string;
    estado?: number;
}

export interface UpdatePositionDto {
    nombre?: string;
    estado?: number;
}
