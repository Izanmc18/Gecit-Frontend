export interface Entidad {
  id: string;
  nombre: string;
  dominio: string;
  logoUrl?: string;
}

export interface Tramite {
  id: string;
  nombreTramite: string;
  idEntidad: string;
}

export interface SlotResponse {
  slots: string[];
}
