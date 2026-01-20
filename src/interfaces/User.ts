import type { Permission } from './Permission';

export interface User {
    usu_id: number;
    usu_correo: string;
    rol_id: number | null;
    reg_id: number | null;
    car_id: number | null;
    dp_id: number | null;
    es_nacional: boolean | number;
    nombre: string;
    apellido: string;
    permissions?: Permission[];
    role?: {
        id: number;
        nombre: string;
        descripcion?: string;
        estado?: number;
    };
    cargo?: {
        id: number;
        nombre: string;
        estado: number;
    };
    regional?: {
        id: number;
        nombre: string;
        estado: number;
        zonaId: number;
    };
    departamento?: {
        id: number;
        nombre: string;
        fechaCreacion: string;
        fechaModificacion: string | null;
        fechaEliminacion: string | null;
        estado: number;
    };
}
