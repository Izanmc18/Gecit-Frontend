export enum TipoAusencia {
  VACACIONES = 'Vacaciones',
  ENFERMEDAD = 'Enfermedad',
  ASUNTOS_PROPIOS = 'Asuntos Propios',
  OTRO = 'Otro',
}

export interface AbsenceRequest {
  idUsuario: string;
  tipo: TipoAusencia;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
}

export interface AbsenceResponse extends AbsenceRequest {
  id: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  fechaSolicitud: string;
}
