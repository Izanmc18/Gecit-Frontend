import { User } from "./auth.model";

export enum EstadoCita {
  PENDIENTE = 'Pendiente',
  REALIZADA = 'Realizada',
  NO_PRESENTADO = 'No presentado',
  CANCELADA = 'Cancelada',
}

export interface Cita {
  id: string;
  clienteNombre: string;
  clienteApellidos: string;
  clienteDni: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  fechaHora: string;
  estado: EstadoCita;
  observaciones?: string;
  idUsuarioAsignado: string;
  usuarioAsignado?: { nombre: string };
  idMesa: string;
  mesa?: { nombreMesa: string, numero?: number };
  idTramite: string;
  tramite?: { nombreTramite: string };
  turnoLlegada?: TurnoLlegada;
}

export enum EstadoTurno {
  EN_ESPERA = 'En espera',
  LLAMADO = 'Llamado',
  ATENDIDO = 'Atendido',
  DESCARTADO = 'Descartado',
}

export interface TurnoLlegada {
  id: string;
  codigoTicket: string;
  estado: EstadoTurno;
  fechaGeneracion: string;
  fechaLlamada?: string;
}
