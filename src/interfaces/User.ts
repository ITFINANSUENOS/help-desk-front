// User entity interface
export interface User {
    id: number;
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    rolId: number;
    regionalId: number | null;
    cargoId: number | null;
    departamentoId: number | null;
    esNacional: boolean;
    estado: number; // 1=active, 0=inactive

    // Relations (optional, loaded with 'included')
    role?: {
        id: number;
        nombre: string;
    };
    regional?: {
        id: number;
        nombre: string;
    };
    cargo?: {
        id: number;
        nombre: string;
    };
    departamento?: {
        id: number;
        nombre: string;
    };
}

// Create user DTO
export interface CreateUserDto {
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rolId: number;
    regionalId?: number;
    cargoId?: number;
    departamentoId?: number;
    esNacional?: boolean;
    empresasIds?: number[];
}

// Update user DTO
export interface UpdateUserDto {
    cedula?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    password?: string;
    rolId?: number;
    regionalId?: number;
    cargoId?: number;
    departamentoId?: number;
    esNacional?: boolean;
    estado?: number;
    empresasIds?: number[];
}

// User filter interface
export interface UserFilter {
    search?: string;
    rolId?: number | 'all';
    cargoId?: number | 'all';
    regionalId?: number | 'all';
    estado?: number | 'all';
    page?: number;
    limit?: number;
}

// User list response
export interface UserListResponse {
    data: User[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
