export interface ListaPrecio {
  id: number;
  marca: string;
  nombre: string | null;
  tipo: 'venta' | 'costos';
  fechaVigencia: string | null;
  archivoUrl: string | null;
  archivoNombre: string | null;
  estado: number;
  esVigente: number;
  usuarioCreaId: number | null;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface CreateListaPrecioDto {
  marca: string;
  nombre?: string;
  tipo: 'venta' | 'costos';
  fechaVigencia?: string;
  archivoUrl?: string;
  archivoNombre?: string;
}

export interface UpdateListaPrecioDto {
  marca?: string;
  nombre?: string;
  tipo?: 'venta' | 'costos';
  fechaVigencia?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  esVigente?: number;
  estado?: number;
}
