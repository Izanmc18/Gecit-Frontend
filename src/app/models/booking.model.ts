export interface Entidad {
  id: string;
  nombre: string;
}

export interface Tramite {
  id: string;
  nombreTramite: string;
  idEntidad: string;
}

export interface SlotResponse {
  slots: string[];
}
