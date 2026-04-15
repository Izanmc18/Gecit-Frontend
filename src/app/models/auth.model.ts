export interface LoginRequest {
  email: string;
  password?: string;
}

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}
