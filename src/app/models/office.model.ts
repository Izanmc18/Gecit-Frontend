export interface Sala {
  id: string;
  nombreSala: string;
  canvasWidth: number;
  canvasHeight: number;
  colorFondo: string;
  idEntidad: string;
  mesas?: Mesa[];
}

export interface Mesa {
  id: string;
  nombreMesa: string;
  posX: number;
  posY: number;
  rotacion: number;
  ancho: number;
  largo: number;
  estado: string;
  idSala: string;
}

export interface UpdateMesaDto {
  posX?: number;
  posY?: number;
  rotacion?: number;
  nombreMesa?: string;
  ancho?: number;
  largo?: number;
  estado?: string;
}

export interface UpdateSalaDto {
  nombreSala?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  colorFondo?: string;
}
