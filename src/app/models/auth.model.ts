export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  password?: string;
  telefono: string;
}

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  idRol: string;
  idEntidad: string;
  dni?: string;
  telefono?: string;
  rol?: any;
  fotoUrl?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  requirePasswordChange?: boolean;
}
