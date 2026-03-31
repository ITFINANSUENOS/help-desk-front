export interface ListaPrecio {
  id: number;
  descripcion: string | null;
  tipo: 'general' | 'promocional' | 'finansuenos';
  fechaInicio: string | null;
  fechaFin: string | null;
  archivoUrl: string | null;
  archivoNombre: string | null;
  estado: number;
  esVigente: number;
  usuarioCreaId: number | null;
  fechaCreacion: string;
  fechaModificacion: string;
  departamentoId?: number | null;
  departamento?: { id: number; nombre: string } | null;
}

export interface CreateListaPrecioDto {
  descripcion?: string;
  tipo: 'general' | 'promocional' | 'finansuenos';
  fechaInicio?: string;
  fechaFin?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  departamentoId?: number;
}

export interface UpdateListaPrecioDto {
  descripcion?: string;
  tipo?: 'general' | 'promocional' | 'finansuenos';
  fechaInicio?: string;
  fechaFin?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  esVigente?: number;
  estado?: number;
  departamentoId?: number;
}
