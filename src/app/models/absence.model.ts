export enum TipoAusencia {
  VACACIONES = 'Vacaciones',
  BAJA_MEDICA = 'Baja Medica',
  ASUNTOS_PROPIOS = 'Asuntos Propios',
}

export interface AbsenceRequest {
  idUsuario: string;
  tipo: TipoAusencia;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
}

export interface Absence extends AbsenceResponse {}

export interface AbsenceResponse extends AbsenceRequest {
  id: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  fechaSolicitud: string;
  usuarioNombre?: string;
  usuarioEmail?: string;
}
