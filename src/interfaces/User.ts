import type { Permission } from './Permission';

/**
 * Representa un usuario en el sistema.
 * Mapea la estructura devuelta por el endpoint `/auth/profile`.
 */
export interface User {
    /** ID único del usuario en la base de datos. */
    usu_id: number;
    /** Correo electrónico del usuario. */
    usu_correo: string;
    /** ID del rol asignado (referencia). */
    rol_id: number | null;
    /** ID de la regional asignada (referencia). */
    reg_id: number | null;
    /** ID del cargo asignado (referencia). */
    car_id: number | null;
    /** ID del departamento asignado (referencia). */
    dp_id: number | null;
    /** Indicador de si es usuario nacional. */
    es_nacional: boolean | number;
    /** Nombre de pila. */
    nombre: string;
    /** Apellido. */
    apellido: string;
    /** Lista de permisos calculados para este usuario (opcional). */
    permissions?: Permission[];
    /** Objeto con detalles del rol. */
    role?: {
        id: number;
        nombre: string;
        descripcion?: string;
        estado?: number;
    };
    /** Objeto con detalles del cargo. */
    cargo?: {
        id: number;
        nombre: string;
        estado: number;
    };
    /** Objeto con detalles de la regional. */
    regional?: {
        id: number;
        nombre: string;
        estado: number;
        zonaId: number;
    };
    /** Objeto con detalles del departamento. */
    departamento?: {
        id: number;
        nombre: string;
        fechaCreacion: string;
        fechaModificacion: string | null;
        fechaEliminacion: string | null;
        estado: number;
    };
}
