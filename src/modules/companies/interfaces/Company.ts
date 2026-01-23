export interface Company {
    id: number;
    nombre: string;
    estado: number; // 1=active, 0=inactive
    createdAt?: string;
}

export interface CreateCompanyDto {
    nombre: string;
    estado?: number;
}

export interface UpdateCompanyDto {
    nombre?: string;
    estado?: number;
}

export interface CompanyFilter {
    search?: string;
    estado?: number | 'all';
    page?: number;
    limit?: number;
}

export interface CompanyListResponse {
    data: Company[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
