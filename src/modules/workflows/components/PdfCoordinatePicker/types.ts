export interface PlacementMarker {
  id: string;
  pasoId: number;
  label: string;
  coordX: number;
  coordY: number;
  pagina: number;
}

export interface PdfClickCoord {
  x: number;
  y: number;
  page: number;
}

export type PickerMode = 'firma' | 'campo';