export interface Sala {
  id: string;
  nombreSala: string;
  canvasWidth: number;
  canvasHeight: number;
  colorFondo: string;
  urlPlano?: string;
  idEntidad: string;
  mesas?: Mesa[];
}

export interface CreateSalaDto {
  nombreSala: string;
  idEntidad: string;
  canvasWidth?: number;
  canvasHeight?: number;
  colorFondo?: string;
  urlPlano?: string;
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
  urlPlano?: string;
}

export enum AssignmentShift {
  MANANA = 'Mañana',
  TARDE = 'Tarde',
  COMPLETO = 'Completo',
}

export interface DeskAssignment {
  id: string;
  idUsuario: string;
  idMesa: string;
  fecha: string;
  turno: AssignmentShift;
  usuario?: any;
  mesa?: any;
}
