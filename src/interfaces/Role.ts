export interface Role {
    id: number;
    nombre: string;
    descripcion: string;
    estado: number;
}

export interface CreateRoleDto {
    nombre: string;
    descripcion: string;
}

export interface UpdateRoleDto {
    nombre?: string;
    descripcion?: string;
    estado?: number;
}
